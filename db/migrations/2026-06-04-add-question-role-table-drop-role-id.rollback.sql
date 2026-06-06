-- Rollback: restore questions.role_id from question_role and drop the join table
-- WARNING: if a question had multiple roles this rollback picks one arbitrarily (DISTINCT ON).

-- Step 1: restore role_id column
ALTER TABLE public.questions
    ADD COLUMN IF NOT EXISTS role_id UUID NULL;

-- Step 2: restore the FK constraint
ALTER TABLE public.questions
    ADD CONSTRAINT questions_role_id_fkey
        FOREIGN KEY (role_id)
        REFERENCES public.roles (id)
        ON DELETE CASCADE;

-- Step 3: restore the index
CREATE INDEX IF NOT EXISTS idx_questions_role_id
    ON public.questions (role_id);

-- Step 4: backfill role_id from question_role (picks one role per question)
UPDATE public.questions q
SET role_id = qr.role_id
FROM (
    SELECT DISTINCT ON (question_id) question_id, role_id
    FROM public.question_role
    ORDER BY question_id, created_at
) qr
WHERE q.id = qr.question_id;

-- Step 5: drop the join table
DROP TABLE IF EXISTS public.question_role;
