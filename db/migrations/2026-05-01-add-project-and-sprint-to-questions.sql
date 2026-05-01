BEGIN;

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS project_id uuid NULL;

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS sprint_id uuid NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_questions_project_id'
  ) THEN
    ALTER TABLE questions
    ADD CONSTRAINT fk_questions_project_id
    FOREIGN KEY (project_id)
    REFERENCES projects(id)
    ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_questions_sprint_id'
  ) THEN
    ALTER TABLE questions
    ADD CONSTRAINT fk_questions_sprint_id
    FOREIGN KEY (sprint_id)
    REFERENCES sprints(id)
    ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_questions_project_id
ON questions(project_id);

CREATE INDEX IF NOT EXISTS idx_questions_sprint_id
ON questions(sprint_id);

COMMIT;
