/**
 * Professional BNI-branded HTML email templates.
 *
 * All templates use inline CSS for email client compatibility and
 * follow BNI's orange (#F05A28) accent color scheme.
 */

import "server-only";

import { getServerEnv } from "@/lib/server-env";

const APP_URL = getServerEnv().NEXT_PUBLIC_APP_URL;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cleanSubject(value: string): string {
  return value
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#F05A28 0%,#E04A18 100%);padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">BNI Leave System</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:#fafafa;border-top:1px solid #e4e4e7;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;text-align:center;line-height:1.6;">
                This is an automated notification from BNI Leave System.<br/>
                Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function detailRow(label: string, value: string, trustedHtml = false): string {
  return `<tr>
    <td style="padding:8px 12px;color:#71717a;font-size:14px;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:8px 12px;color:#18181b;font-size:14px;font-weight:500;">${trustedHtml ? value : escapeHtml(value)}</td>
  </tr>`;
}

function detailsTable(rows: { label: string; value: string; trustedHtml?: boolean }[]): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fafafa;border-radius:8px;border:1px solid #e4e4e7;margin:20px 0;">
    ${rows.map((r) => detailRow(r.label, r.value, r.trustedHtml)).join("")}
  </table>`;
}

function actionButton(requestId: string, text: string): string {
  const url = new URL(`/dashboard/leave/requests/${encodeURIComponent(requestId)}`, APP_URL).toString();
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px auto 8px auto;">
    <tr>
      <td style="background-color:#F05A28;border-radius:8px;">
        <a href="${escapeHtml(url)}" target="_blank" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.3px;">
          ${escapeHtml(text)}
        </a>
      </td>
    </tr>
  </table>`;
}

// ---------------------------------------------------------------------------
// 1. Leave Submitted — sent to manager
// ---------------------------------------------------------------------------

export function leaveSubmittedTemplate(params: {
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  requestNumber: string;
  requestId: string;
}): { subject: string; html: string } {
  const employeeName = escapeHtml(params.employeeName);
  const subject = cleanSubject(
    `[Leave Request] ${params.employeeName} - ${params.leaveType} (${params.days} day${params.days !== 1 ? "s" : ""})`,
  );

  const html = baseLayout(`
    <h2 style="margin:0 0 8px 0;color:#18181b;font-size:18px;font-weight:600;">New Leave Request Submitted</h2>
    <p style="margin:0 0 16px 0;color:#52525b;font-size:14px;line-height:1.6;">
      <strong>${employeeName}</strong> has submitted a leave request that requires your approval.
    </p>
    ${detailsTable([
      { label: "Request No.", value: params.requestNumber },
      { label: "Leave Type", value: params.leaveType },
      { label: "Start Date", value: params.startDate },
      { label: "End Date", value: params.endDate },
      { label: "Duration", value: `${params.days} day${params.days !== 1 ? "s" : ""}` },
    ])}
    <p style="margin:16px 0 0 0;color:#52525b;font-size:14px;line-height:1.6;">
      Please review and take action on this request at your earliest convenience.
    </p>
    ${actionButton(params.requestId, "Review Request")}
  `);

  return { subject, html };
}

// ---------------------------------------------------------------------------
// 2. Leave Approved — sent to employee
// ---------------------------------------------------------------------------

export function leaveApprovedTemplate(params: {
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  requestNumber: string;
  requestId: string;
  approverName: string;
}): { subject: string; html: string } {
  const employeeName = escapeHtml(params.employeeName);
  const approverName = escapeHtml(params.approverName);
  const subject = cleanSubject(`[Approved] Leave Request ${params.requestNumber} - ${params.leaveType}`);

  const html = baseLayout(`
    <div style="text-align:center;margin-bottom:20px;">
      <div style="display:inline-block;width:56px;height:56px;background-color:#dcfce7;border-radius:50%;line-height:56px;text-align:center;font-size:28px;">✓</div>
    </div>
    <h2 style="margin:0 0 8px 0;color:#18181b;font-size:18px;font-weight:600;text-align:center;">Leave Request Approved</h2>
    <p style="margin:0 0 16px 0;color:#52525b;font-size:14px;line-height:1.6;text-align:center;">
      Hi <strong>${employeeName}</strong>, your leave request has been approved by <strong>${approverName}</strong>.
    </p>
    ${detailsTable([
      { label: "Request No.", value: params.requestNumber },
      { label: "Leave Type", value: params.leaveType },
      { label: "Start Date", value: params.startDate },
      { label: "End Date", value: params.endDate },
      { label: "Duration", value: `${params.days} day${params.days !== 1 ? "s" : ""}` },
      { label: "Status", value: '<span style="color:#16a34a;font-weight:600;">Approved</span>', trustedHtml: true },
    ])}
    ${actionButton(params.requestId, "View Request")}
  `);

  return { subject, html };
}

// ---------------------------------------------------------------------------
// 3. Leave Rejected — sent to employee
// ---------------------------------------------------------------------------

export function leaveRejectedTemplate(params: {
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  requestNumber: string;
  requestId: string;
  approverName: string;
  rejectionReason: string;
}): { subject: string; html: string } {
  const employeeName = escapeHtml(params.employeeName);
  const approverName = escapeHtml(params.approverName);
  const subject = cleanSubject(`[Rejected] Leave Request ${params.requestNumber} - ${params.leaveType}`);

  const html = baseLayout(`
    <div style="text-align:center;margin-bottom:20px;">
      <div style="display:inline-block;width:56px;height:56px;background-color:#fee2e2;border-radius:50%;line-height:56px;text-align:center;font-size:28px;">✕</div>
    </div>
    <h2 style="margin:0 0 8px 0;color:#18181b;font-size:18px;font-weight:600;text-align:center;">Leave Request Rejected</h2>
    <p style="margin:0 0 16px 0;color:#52525b;font-size:14px;line-height:1.6;text-align:center;">
      Hi <strong>${employeeName}</strong>, your leave request has been rejected by <strong>${approverName}</strong>.
    </p>
    ${detailsTable([
      { label: "Request No.", value: params.requestNumber },
      { label: "Leave Type", value: params.leaveType },
      { label: "Start Date", value: params.startDate },
      { label: "End Date", value: params.endDate },
      { label: "Duration", value: `${params.days} day${params.days !== 1 ? "s" : ""}` },
      { label: "Status", value: '<span style="color:#dc2626;font-weight:600;">Rejected</span>', trustedHtml: true },
    ])}
    <div style="margin:16px 0;padding:16px;background-color:#fef2f2;border-left:4px solid #dc2626;border-radius:4px;">
      <p style="margin:0 0 4px 0;color:#991b1b;font-size:13px;font-weight:600;">Reason for Rejection</p>
      <p style="margin:0;color:#7f1d1d;font-size:14px;line-height:1.5;">${escapeHtml(params.rejectionReason)}</p>
    </div>
    ${actionButton(params.requestId, "View Request")}
  `);

  return { subject, html };
}

// ---------------------------------------------------------------------------
// 4. Balance Adjusted — sent to employee
// ---------------------------------------------------------------------------

export function balanceAdjustedTemplate(params: {
  employeeName: string;
  leaveType: string;
  adjustmentDays: number;
  reason: string;
  newBalance: number;
}): { subject: string; html: string } {
  const direction = params.adjustmentDays > 0 ? "increased" : "decreased";
  const absDays = Math.abs(params.adjustmentDays);
  const employeeName = escapeHtml(params.employeeName);
  const subject = cleanSubject(
    `[Balance Update] ${params.leaveType} balance ${direction} by ${absDays} day${absDays !== 1 ? "s" : ""}`,
  );

  const badgeColor = params.adjustmentDays > 0 ? "#16a34a" : "#dc2626";
  const badgeBg = params.adjustmentDays > 0 ? "#dcfce7" : "#fee2e2";
  const sign = params.adjustmentDays > 0 ? "+" : "";

  const html = baseLayout(`
    <h2 style="margin:0 0 8px 0;color:#18181b;font-size:18px;font-weight:600;">Leave Balance Adjusted</h2>
    <p style="margin:0 0 16px 0;color:#52525b;font-size:14px;line-height:1.6;">
      Hi <strong>${employeeName}</strong>, your leave balance has been updated.
    </p>
    ${detailsTable([
      { label: "Leave Type", value: params.leaveType },
      {
        label: "Adjustment",
        value: `<span style="display:inline-block;padding:2px 10px;background-color:${badgeBg};color:${badgeColor};border-radius:999px;font-weight:600;font-size:13px;">${sign}${params.adjustmentDays} day${absDays !== 1 ? "s" : ""}</span>`,
        trustedHtml: true,
      },
      { label: "Reason", value: params.reason },
    ])}
    <p style="margin:16px 0 0 0;color:#52525b;font-size:14px;line-height:1.6;">
      If you believe this adjustment was made in error, please contact your HR administrator.
    </p>
  `);

  return { subject, html };
}
