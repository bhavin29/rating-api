DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'audit_action_enum'
      AND e.enumlabel = 'UPDATE_PROJECT'
  ) THEN
    ALTER TYPE audit_action_enum ADD VALUE 'UPDATE_PROJECT';
  END IF;
END $$;
