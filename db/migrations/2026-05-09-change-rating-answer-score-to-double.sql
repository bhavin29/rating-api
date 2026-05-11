BEGIN;

ALTER TABLE rating_answers
ALTER COLUMN score TYPE double precision
USING score::double precision;

COMMIT;
