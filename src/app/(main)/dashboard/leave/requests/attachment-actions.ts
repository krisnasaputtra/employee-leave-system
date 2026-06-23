"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

interface AttachmentActionResult {
  success: boolean;
  error?: string;
  attachment_id?: string;
}

/**
 * Upload an attachment file to a PENDING leave request.
 * Validates ownership, request status, MIME type, and file size.
 */
export async function uploadAttachmentAction(requestId: string, formData: FormData): Promise<AttachmentActionResult> {
  const { employee } = await getAuthenticatedUser();
  const supabase = await createClient();

  // 1. Verify request ownership and PENDING status
  const { data: request, error: reqError } = await supabase
    .from("leave_requests")
    .select("id, employee_id, status")
    .eq("id", requestId)
    .single();

  if (reqError || !request) {
    return { success: false, error: "Leave request not found." };
  }

  if (request.employee_id !== employee.id) {
    return { success: false, error: "You can only upload attachments to your own requests." };
  }

  if (request.status !== "PENDING") {
    return { success: false, error: "Attachments can only be uploaded to pending requests." };
  }

  // 2. Get file from FormData
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "No file provided." };
  }

  // 3. Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      success: false,
      error: `Invalid file type "${file.type}". Allowed: PDF, JPEG, PNG.`,
    };
  }

  // 4. Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum: 5 MB.`,
    };
  }

  // 5. Generate safe storage path
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const safeExt = ["pdf", "jpg", "jpeg", "png"].includes(ext) ? ext : "bin";
  const uniqueId = crypto.randomUUID();
  const storagePath = `${employee.id}/${requestId}/${uniqueId}.${safeExt}`;

  // Sanitize original name for display only
  const originalName = file.name.replace(/[^\w\s.\-()]/g, "_").slice(0, 255);

  // 6. Upload to Storage
  const { error: uploadError } = await supabase.storage.from("leave-attachments").upload(storagePath, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    console.error("Storage upload failed:", uploadError.message);
    return { success: false, error: "Failed to upload file. Please try again." };
  }

  // 7. Insert metadata record
  const { data: attachment, error: metaError } = await supabase
    .from("leave_request_attachments")
    .insert({
      leave_request_id: requestId,
      storage_path: storagePath,
      original_name: originalName,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by_employee_id: employee.id,
    })
    .select("id")
    .single();

  if (metaError) {
    // Rollback: delete storage object if metadata insert fails
    await supabase.storage.from("leave-attachments").remove([storagePath]);
    console.error("Attachment metadata insert failed:", metaError.message);
    return { success: false, error: "Failed to save attachment metadata." };
  }

  // 8. Audit log
  await supabase.from("audit_logs").insert({
    actor_employee_id: employee.id,
    action: "ATTACHMENT_UPLOADED",
    entity_type: "leave_request_attachment",
    entity_id: attachment?.id ?? null,
    metadata: {
      leave_request_id: requestId,
      original_name: originalName,
      mime_type: file.type,
      size_bytes: file.size,
    },
  });

  revalidatePath(`/dashboard/leave/requests/${requestId}`);

  return { success: true, attachment_id: attachment?.id ?? "" };
}

/**
 * Remove an attachment from a PENDING leave request.
 * Only the owner (while PENDING) or Admin can remove.
 */
export async function removeAttachmentAction(attachmentId: string, requestId: string): Promise<AttachmentActionResult> {
  const { employee } = await getAuthenticatedUser();
  const supabase = await createClient();

  // 1. Get attachment and verify
  const { data: attachment, error: attError } = await supabase
    .from("leave_request_attachments")
    .select("id, storage_path, original_name, leave_request_id, uploaded_by_employee_id")
    .eq("id", attachmentId)
    .single();

  if (attError || !attachment) {
    return { success: false, error: "Attachment not found." };
  }

  if (attachment.leave_request_id !== requestId) {
    return { success: false, error: "Attachment does not belong to this request." };
  }

  // 2. Check authorization
  const { data: request } = await supabase
    .from("leave_requests")
    .select("employee_id, status")
    .eq("id", requestId)
    .single();

  if (!request) {
    return { success: false, error: "Leave request not found." };
  }

  const isOwner = request.employee_id === employee.id;
  const isAdmin = employee.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return { success: false, error: "Not authorized to remove this attachment." };
  }

  if (isOwner && request.status !== "PENDING") {
    return { success: false, error: "Attachments can only be removed from pending requests." };
  }

  // 3. Delete from storage
  const { error: storageError } = await supabase.storage.from("leave-attachments").remove([attachment.storage_path]);

  if (storageError) {
    console.error("Storage delete failed:", storageError.message);
    return { success: false, error: "Failed to delete file from storage." };
  }

  // 4. Delete metadata record
  const { error: deleteError } = await supabase.from("leave_request_attachments").delete().eq("id", attachmentId);

  if (deleteError) {
    console.error("Attachment metadata delete failed:", deleteError.message);
    return { success: false, error: "Failed to remove attachment record." };
  }

  // 5. Audit log
  await supabase.from("audit_logs").insert({
    actor_employee_id: employee.id,
    action: "ATTACHMENT_REMOVED",
    entity_type: "leave_request_attachment",
    entity_id: attachmentId,
    metadata: {
      leave_request_id: requestId,
      original_name: attachment.original_name,
      removed_by: isAdmin && !isOwner ? "admin" : "owner",
    },
  });

  revalidatePath(`/dashboard/leave/requests/${requestId}`);

  return { success: true };
}

/**
 * Get a short-lived signed download URL for an attachment.
 * Authorized: owner, direct manager, admin.
 */
export async function getAttachmentDownloadUrlAction(
  attachmentId: string,
): Promise<{ success: boolean; url?: string; error?: string }> {
  const { employee } = await getAuthenticatedUser();
  const supabase = await createClient();

  // 1. Get attachment
  const { data: attachment, error: attError } = await supabase
    .from("leave_request_attachments")
    .select("id, storage_path, leave_request_id, original_name")
    .eq("id", attachmentId)
    .single();

  if (attError || !attachment) {
    return { success: false, error: "Attachment not found." };
  }

  // 2. Get request + owner
  const { data: request } = await supabase
    .from("leave_requests")
    .select("employee_id")
    .eq("id", attachment.leave_request_id)
    .single();

  if (!request) {
    return { success: false, error: "Leave request not found." };
  }

  // 3. Authorization: owner, direct manager, or admin
  const isOwner = request.employee_id === employee.id;
  const isAdmin = employee.role === "ADMIN";

  let isManager = false;
  if (!isOwner && !isAdmin) {
    const { data: ownerEmployee } = await supabase
      .from("employees")
      .select("manager_id")
      .eq("id", request.employee_id)
      .single();

    isManager = ownerEmployee?.manager_id === employee.id;
  }

  if (!isOwner && !isAdmin && !isManager) {
    return { success: false, error: "Not authorized to access this attachment." };
  }

  // 4. Generate signed URL (60 seconds)
  const { data: signedData, error: signError } = await supabase.storage
    .from("leave-attachments")
    .createSignedUrl(attachment.storage_path, 60);

  if (signError || !signedData?.signedUrl) {
    console.error("Signed URL generation failed:", signError?.message);
    return { success: false, error: "Failed to generate download link." };
  }

  // 5. Audit for manager/admin access (not owner)
  if (!isOwner) {
    await supabase.from("audit_logs").insert({
      actor_employee_id: employee.id,
      action: "ATTACHMENT_ACCESSED",
      entity_type: "leave_request_attachment",
      entity_id: attachmentId,
      metadata: {
        leave_request_id: attachment.leave_request_id,
        original_name: attachment.original_name,
        accessed_by_role: isAdmin ? "admin" : "manager",
      },
    });
  }

  return { success: true, url: signedData.signedUrl };
}
