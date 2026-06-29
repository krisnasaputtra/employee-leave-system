-- Fix: Request number generation collision
-- The current sequence is global and doesn't reset per year, which can cause
-- duplicates when the year changes. Fix: use date + sequence with retry loop.

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

    -- Check if this number already exists
    IF NOT EXISTS (
      SELECT 1 FROM public.leave_requests WHERE request_number = v_number
    ) THEN
      RETURN v_number;
    END IF;

    v_attempts := v_attempts + 1;
    IF v_attempts > 100 THEN
      RAISE EXCEPTION 'Could not generate unique request number after 100 attempts';
    END IF;
  END LOOP;
END;
$$;

-- Also re-sync the sequence to avoid immediate collisions
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
