import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const GRAPHQL_URL = `${BASE_URL}/graphql`;
const INCLUDE_WRITES = (__ENV.INCLUDE_WRITES || 'false').toLowerCase() === 'true';

export const graphqlErrors = new Counter('graphql_errors');
export const appErrors = new Rate('app_errors');

export const options = {
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  scenarios: {
    api_load: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: 100 },
        { duration: '2m', target: 100 },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '15s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['avg<500', 'p(95)<1000'],
    app_errors: ['rate<0.01'],
  },
};

const queries = {
  getRoles: `query GetRoles { getRoles { id name } }`,
  getUsers: `query GetUsers { getUsers { id fullName email isActive roleId } }`,
  getProjects: `query GetProjects { getProjects { id name status } }`,
  questions: `query Questions($take: Int) { questions(take: $take) { id text roleId isActive projectId sprintId } }`,
  validateToken: `mutation ValidateToken($token: String!) { validateToken(input: { token: $token }) { valid reason userId } }`,
  getQuestionsByRole: `query GetQuestionsByRole($roleId: String!) { getQuestionsByRole(roleId: $roleId) { id text isActive roleId } }`,
  question: `query Question($id: String!) { question(id: $id) { id text isActive roleId } }`,
  getSprints: `query GetSprints($projectId: String!) { getSprints(projectId: $projectId) { id name startDate endDate } }`,
  getProjectMembers: `query GetProjectMembers($projectId: String!) { getProjectMembers(projectId: $projectId) { id isActive roleId user { id fullName email roleId } } }`,
  getSprintRatings: `query GetSprintRatings($sprintId: String!) { getSprintRatings(sprintId: $sprintId) { userId userName averageScore } }`,
  getUser: `query GetUser($userId: String!) { getUser(userId: $userId) { id fullName email roleId isActive } }`,
  getUserProjectSprintData: `query GetUserProjectSprintData($userId: String!) { getUserProjectSprintData(userId: $userId) { userId userName projectId projectName sprintId sprintName sprintProjectMemberId } }`,
  generateSprintRatingRequest: `query GenerateSprintRatingRequest($spmId: String!) { generateSprintRatingRequest(spmId: $spmId) { spmId projectName sprintName ratedUserName questions { id text sprId ratingByUserId ratingByUserName ratingByUserRole } } }`,
};

const writes = {
  createProject: `mutation CreateProject($name: String!) { createProject(input: { name: $name, description: "k6 load test" }) { id name status } }`,
  createRole: `mutation CreateRole($name: String!) { createRole(input: { name: $name }) { id name } }`,
};

export function setup() {
  const seed = {};

  seed.roles = gql(queries.getRoles).json('data.getRoles') || [];
  seed.users = gql(queries.getUsers).json('data.getUsers') || [];
  seed.projects = gql(queries.getProjects).json('data.getProjects') || [];
  seed.questions = gql(queries.questions, { take: 100 }).json('data.questions') || [];

  const project = seed.projects[0];
  if (project) {
    seed.sprints = gql(queries.getSprints, { projectId: project.id }).json('data.getSprints') || [];
    seed.members = gql(queries.getProjectMembers, { projectId: project.id }).json('data.getProjectMembers') || [];
  } else {
    seed.sprints = [];
    seed.members = [];
  }

  seed.roleId = seed.roles[0]?.id;
  seed.userId = seed.users[0]?.id;
  seed.projectId = seed.projects[0]?.id;
  seed.questionId = seed.questions[0]?.id;
  seed.sprintId = seed.sprints[0]?.id;
  seed.spmId = seed.members[0]?.id;

  return seed;
}

export default function (seed) {
  group('graphql read endpoints', () => {
    run('getRoles', queries.getRoles);
    run('getUsers', queries.getUsers);
    run('getProjects', queries.getProjects);
    run('questions', queries.questions, { take: 20 });
    run('validateToken', queries.validateToken, { token: `invalid-${__VU}-${__ITER}` });

    if (seed.roleId) run('getQuestionsByRole', queries.getQuestionsByRole, { roleId: seed.roleId });
    if (seed.questionId) run('question', queries.question, { id: seed.questionId });
    if (seed.projectId) {
      run('getSprints', queries.getSprints, { projectId: seed.projectId });
      run('getProjectMembers', queries.getProjectMembers, { projectId: seed.projectId });
    }
    if (seed.sprintId) run('getSprintRatings', queries.getSprintRatings, { sprintId: seed.sprintId });
    if (seed.userId) runWithCookie('getUserProjectSprintData', queries.getUserProjectSprintData, { userId: seed.userId }, seed.userId);
    if (seed.userId) run('getUser', queries.getUser, { userId: seed.userId });
    if (seed.spmId) run('generateSprintRatingRequest', queries.generateSprintRatingRequest, { spmId: seed.spmId });
  });

  if (INCLUDE_WRITES) {
    group('low-volume write smoke', () => {
      if (__ITER % 100 === 0) {
        run('createProject', writes.createProject, { name: `k6-${Date.now()}-${__VU}-${__ITER}` });
        run('createRole', writes.createRole, { name: `k6-role-${Date.now()}-${__VU}-${__ITER}` });
      }
    });
  }

  sleep(1);
}

function run(name, query, variables = {}) {
  return record(name, gql(query, variables));
}

function runWithCookie(name, query, variables, userId) {
  return record(name, gql(query, variables, { Cookie: `sprint_auth=${encodeURIComponent(userId)}` }));
}

function gql(query, variables = {}, headers = {}) {
  return http.post(
    GRAPHQL_URL,
    JSON.stringify({ query, variables }),
    {
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      tags: { endpoint: getOperationName(query) },
    },
  );
}

function record(name, response) {
  const ok = check(response, {
    [`${name}: status 200`]: (r) => r.status === 200,
    [`${name}: no graphql errors`]: (r) => !hasGraphqlErrors(r),
  });

  if (!ok || response.status >= 400 || hasGraphqlErrors(response)) {
    appErrors.add(1);
  } else {
    appErrors.add(0);
  }

  return response;
}

function hasGraphqlErrors(response) {
  try {
    const body = response.json();
    const hasErrors = Array.isArray(body.errors) && body.errors.length > 0;
    if (hasErrors) {
      graphqlErrors.add(body.errors.length);
    }
    return hasErrors;
  } catch {
    graphqlErrors.add(1);
    return true;
  }
}

function getOperationName(query) {
  const match = query.match(/(?:query|mutation)\s+(\w+)/);
  return match ? match[1] : 'graphql';
}
