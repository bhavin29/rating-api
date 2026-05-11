BEGIN;

ALTER TABLE rating_answers
ALTER COLUMN score TYPE integer
USING round(score)::integer;

COMMIT;
