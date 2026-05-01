ALTER TABLE project_members
ADD COLUMN IF NOT EXISTS role_id uuid NULL;

UPDATE project_members pm
SET role_id = u.role_id
FROM users u
WHERE pm.user_id = u.id
  AND pm.role_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_project_members_role_id'
  ) THEN
    ALTER TABLE project_members
    ADD CONSTRAINT fk_project_members_role_id
    FOREIGN KEY (role_id)
    REFERENCES roles(id)
    ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_project_members_role_id
ON project_members(role_id);
