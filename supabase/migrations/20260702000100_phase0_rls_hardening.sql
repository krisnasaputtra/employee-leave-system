-- Phase 0 production-safety hardening.
--
-- The application uses RPC functions for leave request mutations so balance,
-- ledger, notification, and audit changes happen in one database transaction.
-- Direct PostgREST table mutations must not be an alternate path.

drop policy if exists "leave_requests_insert_own" on public.leave_requests;
drop policy if exists "leave_requests_update_own_pending" on public.leave_requests;
drop policy if exists "leave_requests_update_admin" on public.leave_requests;
drop policy if exists "leave_requests_update_manager" on public.leave_requests;

-- Audit rows are written by SECURITY DEFINER RPCs and server-only admin
-- services/actions. Authenticated clients must not be able to forge audit
-- history directly through the Supabase Data API.
drop policy if exists "audit_logs_insert_authenticated" on public.audit_logs;

