-- =============================================================
-- Migration: Leave Request Attachments
-- Phase 10 — Supabase Storage Attachments
-- =============================================================

-- -------------------------------------------------------
-- 1. Attachment metadata table
-- -------------------------------------------------------
create table public.leave_request_attachments (
  id uuid primary key default gen_random_uuid(),
  leave_request_id uuid not null,
  storage_path text not null,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  uploaded_by_employee_id uuid not null,
  created_at timestamptz not null default now(),

  constraint leave_request_attachments_request_fk
    foreign key (leave_request_id) references public.leave_requests(id) on delete cascade,
  constraint leave_request_attachments_uploader_fk
    foreign key (uploaded_by_employee_id) references public.employees(id) on delete set null,
  constraint leave_request_attachments_mime_check
    check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  constraint leave_request_attachments_size_check
    check (size_bytes > 0 and size_bytes <= 5242880)
);

-- Index for fast lookup by request
create index idx_leave_request_attachments_request_id
  on public.leave_request_attachments(leave_request_id);

-- No updated_at — attachments are immutable once uploaded.

-- -------------------------------------------------------
-- 2. RLS on attachment metadata table
-- -------------------------------------------------------
alter table public.leave_request_attachments enable row level security;

-- SELECT: Owner, direct manager, or admin
create policy "attachments_select_authorized"
  on public.leave_request_attachments for select
  to authenticated
  using (
    exists (
      select 1 from public.leave_requests lr
      join public.employees e on e.id = lr.employee_id
      where lr.id = leave_request_id
        and (
          -- Owner
          lr.employee_id = public.current_employee_id()
          -- Direct manager
          or e.manager_id = public.current_employee_id()
          -- Admin
          or public.is_admin()
        )
    )
  );

-- INSERT: Only owner of a PENDING request
create policy "attachments_insert_owner_pending"
  on public.leave_request_attachments for insert
  to authenticated
  with check (
    uploaded_by_employee_id = public.current_employee_id()
    and exists (
      select 1 from public.leave_requests lr
      where lr.id = leave_request_id
        and lr.employee_id = public.current_employee_id()
        and lr.status = 'PENDING'
    )
  );

-- DELETE: Only owner of a PENDING request, or Admin
create policy "attachments_delete_owner_or_admin"
  on public.leave_request_attachments for delete
  to authenticated
  using (
    (
      uploaded_by_employee_id = public.current_employee_id()
      and exists (
        select 1 from public.leave_requests lr
        where lr.id = leave_request_id
          and lr.employee_id = public.current_employee_id()
          and lr.status = 'PENDING'
      )
    )
    or public.is_admin()
  );

-- No UPDATE policy — attachments are immutable.

-- -------------------------------------------------------
-- 3. Private Storage bucket
-- -------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'leave-attachments',
  'leave-attachments',
  false,
  5242880,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do nothing;

-- -------------------------------------------------------
-- 4. Storage RLS policies
-- -------------------------------------------------------

-- Upload: Authenticated user can upload to their own path
-- Path format: {employee_id}/{leave_request_id}/{filename}
create policy "storage_attachments_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'leave-attachments'
    and (storage.foldername(name))[1] = (public.current_employee_id())::text
  );

-- Read: Owner, direct manager, or admin
create policy "storage_attachments_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'leave-attachments'
    and (
      -- Owner (first folder = their employee_id)
      (storage.foldername(name))[1] = (public.current_employee_id())::text
      -- Admin
      or public.is_admin()
      -- Direct manager: check if the folder owner is their direct report
      or exists (
        select 1 from public.employees e
        where e.id::text = (storage.foldername(name))[1]
          and e.manager_id = public.current_employee_id()
      )
    )
  );

-- Delete: Owner or admin
create policy "storage_attachments_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'leave-attachments'
    and (
      (storage.foldername(name))[1] = (public.current_employee_id())::text
      or public.is_admin()
    )
  );

-- -------------------------------------------------------
-- 5. Signed URL download RPC
-- -------------------------------------------------------
create or replace function public.get_attachment_download_url(p_attachment_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_employee_id uuid;
  v_role text;
  v_attachment record;
  v_request record;
  v_owner_employee record;
  v_url text;
begin
  -- Resolve actor
  select id, role::text into v_employee_id, v_role
  from public.employees
  where auth_user_id = auth.uid() and status = 'ACTIVE'
  limit 1;

  if v_employee_id is null then
    raise exception 'Not authenticated or not an active employee';
  end if;

  -- Get attachment
  select * into v_attachment
  from public.leave_request_attachments
  where id = p_attachment_id;

  if v_attachment is null then
    raise exception 'Attachment not found';
  end if;

  -- Get request
  select * into v_request
  from public.leave_requests
  where id = v_attachment.leave_request_id;

  -- Get owner employee
  select * into v_owner_employee
  from public.employees
  where id = v_request.employee_id;

  -- Authorization check
  if v_request.employee_id != v_employee_id
     and v_owner_employee.manager_id != v_employee_id
     and v_role != 'ADMIN' then
    raise exception 'Not authorized to access this attachment';
  end if;

  -- Generate signed URL (60 seconds)
  select signedurl into v_url
  from storage.signedurl('leave-attachments', v_attachment.storage_path, 60);

  return v_url;
end;
$$;

revoke execute on function public.get_attachment_download_url(uuid) from public;
grant execute on function public.get_attachment_download_url(uuid) to authenticated;
