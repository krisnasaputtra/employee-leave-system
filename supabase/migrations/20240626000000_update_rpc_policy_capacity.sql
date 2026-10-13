-- Migration: Add RPCs for Policy Evaluation and Capacity Warnings

-- 1. Create check_department_capacity RPC
CREATE OR REPLACE FUNCTION public.check_department_capacity(
  p_department_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rule record;
  v_total_employees integer;
  v_max_absent integer;
  v_overlap_date date;
  v_absent_count integer;
BEGIN
  -- Get rule
  SELECT * INTO v_rule
  FROM public.workforce_capacity_rules
  WHERE department_id = p_department_id;
  
  IF v_rule.id IS NULL THEN
    RETURN jsonb_build_object('warning', false);
  END IF;

  -- Get total employees in dept
  SELECT COUNT(*) INTO v_total_employees
  FROM public.employees
  WHERE department_id = p_department_id AND status = 'ACTIVE';

  IF v_total_employees = 0 THEN
    RETURN jsonb_build_object('warning', false);
  END IF;

  -- Calculate max allowed absent
  v_max_absent := floor(v_total_employees * (v_rule.max_absent_percentage / 100.0));
  
  IF v_rule.min_staff_count IS NOT NULL THEN
    v_max_absent := least(v_max_absent, v_total_employees - v_rule.min_staff_count);
  END IF;
  
  IF v_max_absent < 0 THEN
    v_max_absent := 0;
  END IF;

  -- Check capacity for each date in range
  FOR v_overlap_date IN
    SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date
  LOOP
    IF extract(isodow from v_overlap_date) < 6 THEN
      SELECT COUNT(DISTINCT lr.employee_id) INTO v_absent_count
      FROM public.leave_requests lr
      JOIN public.employees e ON e.id = lr.employee_id
      WHERE e.department_id = p_department_id
        AND lr.status = 'APPROVED'
        AND v_overlap_date >= lr.start_date AND v_overlap_date <= lr.end_date;
        
      IF v_absent_count >= v_max_absent THEN
        RETURN jsonb_build_object(
          'warning', true,
          'message', 'Capacity warning on ' || v_overlap_date || '. Max allowed absent: ' || v_max_absent || ' out of ' || v_total_employees || ' employees.'
        );
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('warning', false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_department_capacity(uuid, date, date) TO authenticated;


-- 2. Update create_leave_request to include policy evaluation
CREATE OR REPLACE FUNCTION public.create_leave_request(
  p_leave_type_id uuid,
  p_start_date date,
  p_end_date date,
  p_partial_day public.leave_partial_day default 'NONE',
  p_reason text default ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_id uuid;
  v_actor record;
  v_leave_type record;
  v_policy record;
  v_notice_days integer;
  v_calculated_days numeric(6,2);
  v_overlap_count integer;
  v_balance record;
  v_available numeric(6,2);
  v_request_number text;
  v_request_id uuid;
  v_balance_year integer;
BEGIN
  -- 1. Resolve actor
  SELECT id, status, role::text as role, full_name
  INTO v_actor
  FROM public.employees
  WHERE auth_user_id = auth.uid() AND status = 'ACTIVE'
  LIMIT 1;

  IF v_actor.id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated or not an active employee';
  END IF;
  v_actor_id := v_actor.id;

  -- 2. Validate leave type
  SELECT * INTO v_leave_type
  FROM public.leave_types
  WHERE id = p_leave_type_id AND is_active = true;

  IF v_leave_type.id IS NULL THEN
    RAISE EXCEPTION 'Leave type not found or inactive';
  END IF;

  -- 2b. Evaluate Policies (Notice Period)
  SELECT * INTO v_policy
  FROM public.leave_policies
  WHERE leave_type_id = p_leave_type_id;

  IF v_policy.id IS NOT NULL THEN
    v_notice_days := p_start_date - current_date;
    IF v_notice_days < v_policy.notice_period_days THEN
      RAISE EXCEPTION 'Policy Violation: This leave type requires at least % days of notice. You provided % days.', v_policy.notice_period_days, v_notice_days;
    END IF;
  END IF;

  -- 3. Validate dates
  IF p_start_date > p_end_date THEN
    RAISE EXCEPTION 'Start date cannot be after end date';
  END IF;

  -- 4. Calculate days (server-authoritative)
  v_calculated_days := public.calculate_leave_days(p_start_date, p_end_date, p_partial_day);

  IF v_calculated_days <= 0 THEN
    RAISE EXCEPTION 'No working days in the selected date range';
  END IF;

  -- 4b. Evaluate Policies (Max Consecutive Days)
  IF v_policy.id IS NOT NULL AND v_policy.max_consecutive_days IS NOT NULL THEN
    IF v_calculated_days > v_policy.max_consecutive_days THEN
      RAISE EXCEPTION 'Policy Violation: This leave type allows a maximum of % consecutive working days.', v_policy.max_consecutive_days;
    END IF;
  END IF;

  -- 5. Detect overlap
  SELECT count(*) INTO v_overlap_count
  FROM public.leave_requests
  WHERE employee_id = v_actor_id
    AND status IN ('PENDING', 'APPROVED')
    AND p_start_date <= end_date
    AND p_end_date >= start_date;

  IF v_overlap_count > 0 THEN
    RAISE EXCEPTION 'Date range overlaps with an existing Pending or Approved request';
  END IF;

  -- 6. Determine balance year
  v_balance_year := extract(year FROM p_start_date)::integer;

  -- 7. Lock balance row
  IF v_leave_type.deducts_balance THEN
    SELECT * INTO v_balance
    FROM public.leave_balances
    WHERE employee_id = v_actor_id
      AND leave_type_id = p_leave_type_id
      AND balance_year = v_balance_year
    FOR UPDATE;

    IF v_balance.id IS NULL THEN
      RAISE EXCEPTION 'No balance record found for this leave type and year. Please contact your administrator.';
    END IF;

    -- 8. Check available balance
    v_available := v_balance.entitled_days + v_balance.adjustment_days
                   - v_balance.used_days - v_balance.pending_days;

    IF v_calculated_days > v_available AND (v_leave_type.allow_negative_balance IS NULL OR v_leave_type.allow_negative_balance = false) THEN
      RAISE EXCEPTION 'Insufficient balance. Available: % days, Requested: % days', v_available, v_calculated_days;
    END IF;
  END IF;

  -- 9. Generate request number
  v_request_number := public.generate_request_number();

  -- 10. Insert Pending request
  INSERT INTO public.leave_requests (
    request_number, employee_id, leave_type_id,
    start_date, end_date, requested_days, partial_day,
    reason, status
  ) VALUES (
    v_request_number, v_actor_id, p_leave_type_id,
    p_start_date, p_end_date, v_calculated_days, p_partial_day,
    coalesce(trim(p_reason), ''), 'PENDING'
  )
  RETURNING id INTO v_request_id;

  -- 11. Reserve balance
  IF v_leave_type.deducts_balance AND v_balance.id IS NOT NULL THEN
    UPDATE public.leave_balances
    SET pending_days = pending_days + v_calculated_days
    WHERE id = v_balance.id;

    INSERT INTO public.leave_balance_transactions (
      leave_balance_id, leave_request_id, transaction_type,
      days, reason, actor_employee_id
    ) VALUES (
      v_balance.id, v_request_id, 'RESERVE',
      v_calculated_days,
      'Reserved for request ' || v_request_number,
      v_actor_id
    );
  END IF;

  -- 13. Notification to manager
  DECLARE
    v_manager_id uuid;
  BEGIN
    SELECT manager_id INTO v_manager_id
    FROM public.employees
    WHERE id = v_actor_id;

    IF v_manager_id IS NOT NULL THEN
      INSERT INTO public.notifications (employee_id, title, message)
      VALUES (
        v_manager_id,
        'New Leave Request',
        v_actor.full_name || ' submitted a leave request (' || v_request_number || ') from '
        || p_start_date || ' to ' || p_end_date || ' (' || v_calculated_days || ' days).'
      );
    END IF;
  END;

  -- 14. Audit log
  INSERT INTO public.audit_logs (
    actor_employee_id, action, entity_type, entity_id, metadata
  ) VALUES (
    v_actor_id, 'LEAVE_REQUEST_CREATED', 'leave_request', v_request_id,
    jsonb_build_object(
      'request_number', v_request_number,
      'leave_type_id', p_leave_type_id,
      'start_date', p_start_date,
      'end_date', p_end_date,
      'requested_days', v_calculated_days,
      'partial_day', p_partial_day::text
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request_id,
    'request_number', v_request_number,
    'requested_days', v_calculated_days
  );
END;
$$;
