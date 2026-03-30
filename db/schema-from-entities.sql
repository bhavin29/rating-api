-- Source-of-truth schema generated from the current TypeORM entities.
-- This is best used for a fresh database or a full rebuild.
-- The current live database differs materially from the source:
-- - many primary keys are integer in the DB but uuid in the entities
-- - several column names differ
-- - a few tables have extra/missing columns
--
-- If you need to preserve existing production data, do not run this blindly.
-- In that case, create a staged migration plan instead of dropping/recreating tables.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS overall_ratings CASCADE;
DROP TABLE IF EXISTS aggregated_ratings CASCADE;
DROP TABLE IF EXISTS rating_answers CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS rating_requests CASCADE;
DROP TABLE IF EXISTS secure_tokens CASCADE;
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS sprint_members CASCADE;
DROP TABLE IF EXISTS sprints CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

DROP TYPE IF EXISTS email_type_enum CASCADE;
DROP TYPE IF EXISTS email_status_enum CASCADE;
DROP TYPE IF EXISTS token_type_enum CASCADE;
DROP TYPE IF EXISTS audit_action_enum CASCADE;

CREATE TYPE email_type_enum AS ENUM ('INVITE', 'REMINDER');
CREATE TYPE email_status_enum AS ENUM ('SENT', 'FAILED');
CREATE TYPE token_type_enum AS ENUM ('MAGIC_LINK');
CREATE TYPE audit_action_enum AS ENUM ('CREATE_PROJECT', 'CREATE_SPRINT', 'SUBMIT_RATING');

CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL UNIQUE
);

CREATE TABLE role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_key varchar NOT NULL,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar NOT NULL UNIQUE,
  name varchar NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  role_id uuid NOT NULL REFERENCES roles(id)
);

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  status varchar NULL
);

CREATE TABLE project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_project_member UNIQUE (project_id, user_id)
);

CREATE TABLE sprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE sprint_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id uuid NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_sprint_member UNIQUE (sprint_id, user_id)
);

CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email varchar NOT NULL,
  type email_type_enum NOT NULL,
  status email_status_enum NOT NULL,
  error text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE secure_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token varchar NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type token_type_enum NOT NULL,
  expires_at timestamptz NOT NULL,
  is_used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz NULL
);

CREATE TABLE rating_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id uuid NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  rated_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_id varchar NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id uuid NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  rater_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rated_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  average_score numeric(5, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_single_rating UNIQUE (sprint_id, rater_id, rated_user_id)
);

CREATE TABLE rating_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id uuid NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  score integer NOT NULL
);

CREATE TABLE aggregated_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id uuid NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  average_score numeric(5, 2) NOT NULL,
  CONSTRAINT uq_agg_rating UNIQUE (sprint_id, user_id)
);

CREATE TABLE overall_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  average_score numeric(5, 2) NOT NULL,
  CONSTRAINT uq_overall_rating UNIQUE (user_id)
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action audit_action_enum NOT NULL,
  actor_id varchar NULL,
  metadata jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_sprints_project_id ON sprints(project_id);
CREATE INDEX idx_sprint_members_sprint_id ON sprint_members(sprint_id);
CREATE INDEX idx_sprint_members_user_id ON sprint_members(user_id);
CREATE INDEX idx_questions_role_id ON questions(role_id);
CREATE INDEX idx_secure_tokens_user_id ON secure_tokens(user_id);
CREATE INDEX idx_secure_tokens_token ON secure_tokens(token);
CREATE INDEX idx_rating_requests_sprint_id ON rating_requests(sprint_id);
CREATE INDEX idx_rating_requests_rated_user_id ON rating_requests(rated_user_id);
CREATE INDEX idx_ratings_sprint_id ON ratings(sprint_id);
CREATE INDEX idx_ratings_rater_id ON ratings(rater_id);
CREATE INDEX idx_ratings_rated_user_id ON ratings(rated_user_id);
CREATE INDEX idx_rating_answers_rating_id ON rating_answers(rating_id);
CREATE INDEX idx_rating_answers_question_id ON rating_answers(question_id);
CREATE INDEX idx_aggregated_ratings_sprint_id ON aggregated_ratings(sprint_id);
CREATE INDEX idx_aggregated_ratings_user_id ON aggregated_ratings(user_id);
CREATE INDEX idx_overall_ratings_user_id ON overall_ratings(user_id);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
