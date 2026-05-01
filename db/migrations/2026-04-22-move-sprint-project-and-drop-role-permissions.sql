ALTER TABLE sprint_members
ADD COLUMN IF NOT EXISTS project_id uuid;

UPDATE sprint_members AS sprint_member
SET project_id = sprint.project_id
FROM sprints AS sprint
WHERE sprint_member.sprint_id = sprint.id
  AND sprint_member.project_id IS NULL;

ALTER TABLE sprint_members
ALTER COLUMN project_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_sprint_members_project_id'
  ) THEN
    ALTER TABLE sprint_members
    ADD CONSTRAINT fk_sprint_members_project_id
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sprint_members_project_id ON sprint_members(project_id);

DROP INDEX IF EXISTS idx_sprints_project_id;

ALTER TABLE sprints
DROP COLUMN IF EXISTS project_id;

DROP TABLE IF EXISTS role_permissions;
