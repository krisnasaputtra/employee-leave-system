-- =============================================================
-- Migration: Fix notifications.notification_type missing default
-- =============================================================
-- PROBLEM: All RPCs insert into notifications without notification_type
--          but the column is NOT NULL without a default.
-- FIX:     Add a default value so existing RPCs continue to work.
-- =============================================================

alter table public.notifications
  alter column notification_type set default 'GENERAL';
