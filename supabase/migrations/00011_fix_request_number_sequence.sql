-- Fix: Replace count-based request number generation with a proper PostgreSQL sequence
-- This prevents race conditions where two concurrent requests get the same number.

CREATE SEQUENCE IF NOT EXISTS public.leave_request_number_seq START WITH 1;

-- Sync the sequence to the current max request count to avoid collisions
DO $$
DECLARE
  v_max integer;
BEGIN
  SELECT COALESCE(MAX(
    CAST(NULLIF(regexp_replace(request_number, '[^0-9]', '', 'g'), '') AS integer)
  ), 0) INTO v_max FROM public.leave_requests;
  IF v_max > 0 THEN
    PERFORM setval('public.leave_request_number_seq', v_max);
  END IF;
END $$;

-- Replace the generate_request_number function
CREATE OR REPLACE FUNCTION public.generate_request_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_year text := to_char(current_date, 'YYYY');
  v_seq integer := nextval('public.leave_request_number_seq');
BEGIN
  RETURN 'LR-' || v_year || '-' || lpad(v_seq::text, 5, '0');
END;
$$;

-- Performance: Add index for holiday lookups used by calculate_leave_days()
CREATE INDEX IF NOT EXISTS idx_holidays_active_date
  ON public.holidays(is_active, holiday_date);
