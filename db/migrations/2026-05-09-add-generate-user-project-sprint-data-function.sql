BEGIN;

CREATE OR REPLACE FUNCTION public.generate_user_project_sprint_data(
  p_user_id uuid
)
RETURNS TABLE(
  user_id uuid,
  user_name character varying,
  project_id uuid,
  project_name character varying,
  sprint_id uuid,
  sprint_name character varying,
  sprint_start_date date,
  sprint_end_date date,
  sprint_project_member_id uuid
)
LANGUAGE plpgsql
COST 100
VOLATILE
PARALLEL UNSAFE
ROWS 1000
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.name AS user_name,
    p.id AS project_id,
    p.name AS project_name,
    s.id AS sprint_id,
    s.name AS sprint_name,
    s.start_date AS sprint_start_date,
    s.end_date AS sprint_end_date,
    spm.id AS sprint_project_member_id
  FROM public.sprint_project_member spm
  INNER JOIN public.users u
    ON u.id = spm.user_id
  INNER JOIN public.projects p
    ON p.id = spm.project_id
  INNER JOIN public.sprints s
    ON s.id = spm.sprint_id
  WHERE u.id = p_user_id;
END;
$$;

COMMIT;
