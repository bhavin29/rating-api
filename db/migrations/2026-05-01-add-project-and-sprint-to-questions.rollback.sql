BEGIN;

DROP INDEX IF EXISTS idx_questions_sprint_id;
DROP INDEX IF EXISTS idx_questions_project_id;

ALTER TABLE questions
DROP CONSTRAINT IF EXISTS fk_questions_sprint_id;

ALTER TABLE questions
DROP CONSTRAINT IF EXISTS fk_questions_project_id;

ALTER TABLE questions
DROP COLUMN IF EXISTS sprint_id;

ALTER TABLE questions
DROP COLUMN IF EXISTS project_id;

COMMIT;
