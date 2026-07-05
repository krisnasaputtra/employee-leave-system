-- Fix: Request number generation - reset sequence properly
-- The sequence may be out of sync with existing data.
-- This migration re-creates the function with a more robust approach.

-- First, drop and recreate the sequence, synced to current max
DROP SEQUENCE IF EXISTS public.leave_request_number_seq;
CREATE SEQUENCE public.leave_request_number_seq;

-- Sync to current max number from existing requests
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

-- Replace the function with a retry-safe version
CREATE OR REPLACE FUNCTION public.generate_request_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_year text := to_char(current_date, 'YYYY');
  v_seq integer;
  v_number text;
  v_attempts integer := 0;
BEGIN
  LOOP
    v_seq := nextval('public.leave_request_number_seq');
    v_number := 'LR-' || v_year || '-' || lpad(v_seq::text, 5, '0');

    -- Check uniqueness
    IF NOT EXISTS (
      SELECT 1 FROM public.leave_requests WHERE request_number = v_number
    ) THEN
      RETURN v_number;
    END IF;

    v_attempts := v_attempts + 1;
    IF v_attempts > 100 THEN
      -- Fallback: use timestamp-based number
      RETURN 'LR-' || v_year || '-' || lpad(
        (EXTRACT(EPOCH FROM now())::bigint % 100000)::text, 5, '0'
      );
    END IF;
  END LOOP;
END;
$$;
