-- Migration: replace questions.role_id with question_role join table
-- Backfills existing role associations before dropping the column.

-- Step 1: create the join table
CREATE TABLE IF NOT EXISTS public.question_role
(
    id          UUID      NOT NULL DEFAULT gen_random_uuid(),
    question_id UUID      NOT NULL,
    role_id     UUID      NOT NULL,
    is_active   BOOLEAN   NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by  UUID      NULL,
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by  UUID      NULL,

    CONSTRAINT question_role_pkey
        PRIMARY KEY (id),

    CONSTRAINT question_role_question_id_role_id_key
        UNIQUE (question_id, role_id),

    CONSTRAINT question_role_question_id_fkey
        FOREIGN KEY (question_id)
        REFERENCES public.questions (id)
        ON UPDATE NO ACTION
        ON DELETE CASCADE,

    CONSTRAINT question_role_role_id_fkey
        FOREIGN KEY (role_id)
        REFERENCES public.roles (id)
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_question_role_question_id
    ON public.question_role (question_id);

CREATE INDEX IF NOT EXISTS idx_question_role_role_id
    ON public.question_role (role_id);

ALTER TABLE IF EXISTS public.question_role
    OWNER TO postgres;

-- Step 2: backfill existing role associations from questions.role_id
INSERT INTO public.question_role (question_id, role_id)
SELECT id, role_id
FROM public.questions
WHERE role_id IS NOT NULL
ON CONFLICT (question_id, role_id) DO NOTHING;

-- Step 3: drop the role_id index and column from questions
DROP INDEX IF EXISTS idx_questions_role_id;

ALTER TABLE public.questions
    DROP CONSTRAINT IF EXISTS questions_role_id_fkey,
    DROP COLUMN IF EXISTS role_id;
