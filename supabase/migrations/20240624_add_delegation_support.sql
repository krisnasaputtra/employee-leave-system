-- 1. Create delegation table
CREATE TABLE IF NOT EXISTS approval_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id UUID NOT NULL REFERENCES employees(id),
  delegate_id UUID NOT NULL REFERENCES employees(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_delegate_not_self CHECK (delegator_id != delegate_id),
  CONSTRAINT check_date_range CHECK (end_date >= start_date)
);

-- 2. Enable RLS
ALTER TABLE approval_delegations ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "Managers can manage own delegations"
  ON approval_delegations FOR ALL
  USING (delegator_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));

CREATE POLICY "Delegates can view delegations to them"
  ON approval_delegations FOR SELECT
  USING (delegate_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admin can manage all delegations"
  ON approval_delegations FOR ALL
  USING (EXISTS (SELECT 1 FROM employees WHERE auth_user_id = auth.uid() AND role = 'ADMIN'));

-- 4. Index
CREATE INDEX idx_delegations_active ON approval_delegations (delegate_id, start_date, end_date) WHERE is_active = true;
CREATE INDEX idx_delegations_delegator ON approval_delegations (delegator_id) WHERE is_active = true;
