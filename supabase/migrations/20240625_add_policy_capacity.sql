-- 1. Create leave_policies table
CREATE TABLE IF NOT EXISTS leave_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  notice_period_days INTEGER NOT NULL DEFAULT 0,
  max_consecutive_days INTEGER,
  requires_attachment BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_policy_per_leave_type UNIQUE (leave_type_id)
);

-- 2. Create workforce_capacity_rules table
CREATE TABLE IF NOT EXISTS workforce_capacity_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  max_absent_percentage NUMERIC(5,2), -- e.g., 20.00 for 20%
  min_staff_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_capacity_per_department UNIQUE (department_id),
  CONSTRAINT check_percentage_valid CHECK (max_absent_percentage >= 0 AND max_absent_percentage <= 100),
  CONSTRAINT check_min_staff_valid CHECK (min_staff_count >= 0)
);

-- 3. Enable RLS
ALTER TABLE leave_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce_capacity_rules ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for leave_policies
-- Admins can do anything
CREATE POLICY "Admins can manage leave policies"
  ON leave_policies FOR ALL
  USING (EXISTS (SELECT 1 FROM employees WHERE auth_user_id = auth.uid() AND role = 'ADMIN'));

-- Everyone else can view all policies (needed for validation client-side/server-side)
CREATE POLICY "Anyone can view leave policies"
  ON leave_policies FOR SELECT
  USING (true);

-- 5. RLS Policies for workforce_capacity_rules
-- Admins can do anything
CREATE POLICY "Admins can manage capacity rules"
  ON workforce_capacity_rules FOR ALL
  USING (EXISTS (SELECT 1 FROM employees WHERE auth_user_id = auth.uid() AND role = 'ADMIN'));

-- Managers and Employees can view rules for their own department (to calculate soft warnings)
CREATE POLICY "Employees can view own department capacity rules"
  ON workforce_capacity_rules FOR SELECT
  USING (
    department_id IN (
      SELECT department_id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

-- 6. Indexes
CREATE INDEX idx_leave_policies_type ON leave_policies (leave_type_id);
CREATE INDEX idx_workforce_capacity_dept ON workforce_capacity_rules (department_id);
