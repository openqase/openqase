-- Create deletion_audit_log table for tracking content deletion and restoration
CREATE TABLE IF NOT EXISTS deletion_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  content_name TEXT,
  action TEXT NOT NULL CHECK (action IN ('soft_delete', 'restore', 'permanent_delete')),
  performed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for common query patterns
CREATE INDEX idx_deletion_audit_log_content_type ON deletion_audit_log(content_type);
CREATE INDEX idx_deletion_audit_log_content_id ON deletion_audit_log(content_id);
CREATE INDEX idx_deletion_audit_log_performed_by ON deletion_audit_log(performed_by);
CREATE INDEX idx_deletion_audit_log_performed_at ON deletion_audit_log(performed_at DESC);
CREATE INDEX idx_deletion_audit_log_action ON deletion_audit_log(action);

-- Composite index for common filter combinations
CREATE INDEX idx_deletion_audit_log_type_action_date ON deletion_audit_log(content_type, action, performed_at DESC);

-- Enable Row Level Security
ALTER TABLE deletion_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users can read audit logs
-- Note: Admin checking is done at application level
CREATE POLICY "Authenticated users can view audit logs"
  ON deletion_audit_log
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Service role can insert audit logs (append-only)
-- Inserts are done via service role client which bypasses RLS
CREATE POLICY "Service role can insert audit logs"
  ON deletion_audit_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- RLS Policy: Nobody can update or delete audit logs (immutability)
-- This is enforced by not creating UPDATE/DELETE policies

-- Grant permissions
GRANT SELECT ON deletion_audit_log TO authenticated;
GRANT INSERT ON deletion_audit_log TO service_role;

-- Add comment for documentation
COMMENT ON TABLE deletion_audit_log IS 'Immutable audit trail for content deletion and restoration actions';
COMMENT ON COLUMN deletion_audit_log.metadata IS 'JSONB field for storing content snapshots and additional context';
