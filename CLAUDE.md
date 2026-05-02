# AGENTS.md

Guidance for AI agents and contributors working in this repository.

## Project Overview

`rating-api` is a NestJS 10 API using code-first GraphQL, Apollo, TypeORM, PostgreSQL, Jest, ESLint, and Prettier. The app starts from `src/main.ts`, wires modules in `src/app.module.ts`, and listens on `process.env.PORT` or `3001` by default.

GraphQL schema output is generated to `src/schema.gql` by `GraphQLModule.forRoot({ autoSchemaFile })`. Prefer changing decorators, DTOs, entities, resolvers, and services rather than editing `src/schema.gql` by hand.

## Project Structure

- `src/main.ts` - Nest bootstrap and global validation pipe configuration.
- `src/app.module.ts` - global config, GraphQL setup, and feature module registration.
- `src/common/` - shared enums, validators, decorators, and cross-cutting helpers.
- `src/modules/<feature>/` - feature modules organized by Nest conventions:
  - `dto/` - GraphQL inputs, args, and output types with `class-validator` decorators.
  - `resolvers/` - GraphQL queries and mutations. Keep these thin.
  - `services/` - business logic, validation, persistence, and audit side effects.
  - `*.module.ts` - dependency wiring for the feature.
- `src/modules/database/` - TypeORM config and entity classes.
- `src/modules/database/entities/index.ts` - barrel export for entities. Update it when adding an entity.
- `db/schema-from-entities.sql` - SQL schema reference generated from entities.
- `db/seed-sample-data.sql` - sample data for local development.
- `db/migrations/` - hand-written SQL migrations and rollback files where present.
- `test/` - e2e Jest configuration and e2e test support.
- `dist/` and `node_modules/` - generated/vendor output. Do not edit directly.

## Domain Model Notes

- Project membership is stored in `project_members`. Use it for project-level access, active membership checks, and rating-request recipients.
- Sprints belong to projects through `sprints.project_id` when that column exists. Older data may infer the association from `CREATE_SPRINT` audit metadata.
- The `sprint_members` table has been removed. Do not add `SprintMember` entities, DTOs, resolvers, repository injections, GraphQL types, or new queries against `sprint_members`.
- `requestRating(sprintId)` should resolve the sprint's project, then send requests to active `project_members` for that project.
- If a feature needs sprint-specific participation again, add a new explicit design and migration instead of restoring the old `sprint_members` model by default.

## Commands

Install dependencies:

```bash
npm install
```

Run locally with watch mode:

```bash
npm run start:dev
```

Build:

```bash
npm run build
```

Run unit tests:

```bash
npm test
```

Run a single spec:

```bash
npm test -- questions.service.spec.ts
```

Run e2e tests:

```bash
npm run test:e2e
```

Run coverage:

```bash
npm run test:cov
```

Format source and tests:

```bash
npm run format
```

Lint and auto-fix source and tests:

```bash
npm run lint
```

Production start after building:

```bash
npm run build
npm run start:prod
```

## Environment

Configuration is loaded from `.env.local` first, then `.env`. Do not commit secrets. Database config supports:

- `DATABASE_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_SYNCHRONIZE`
- `DB_LOGGING`
- `DB_SSL`
- `PORT`

Keep `DB_SYNCHRONIZE` off unless explicitly doing local throwaway development. Prefer SQL migrations for persistent schema changes.

## Coding Rules

- Follow existing NestJS patterns: module, resolver, service, DTO, and entity classes should stay in their feature folders.
- Keep resolvers as transport adapters. Put validation, persistence decisions, and side effects in services.
- Use dependency injection and `@InjectRepository(...)` for TypeORM repositories.
- Use TypeORM repository APIs and query builders instead of ad hoc SQL in application code unless a migration or special query requires raw SQL.
- Preserve strict TypeScript. Avoid `any`; if existing GraphQL context typing forces it, keep it contained at the resolver boundary.
- Add or update `class-validator` decorators on DTOs whenever adding input fields.
- Use `IsDbUuid` for database UUID input fields where appropriate.
- Throw Nest exceptions such as `NotFoundException` and `BadRequestException` with clear messages instead of returning nullable error states.
- Keep audit logging behavior consistent when adding create, update, delete, or status-changing mutations.
- Use existing permission names and `@RequirePermissions(...)` patterns for protected GraphQL operations.
- Keep nullable semantics explicit in DTOs and entities. Distinguish `undefined` for "not provided" from `null` for "clear this value" when update inputs support clearing fields.
- Update service tests for behavior changes, especially validation, filtering, permission-sensitive flows, and database association logic.

## GraphQL Conventions

- This project uses code-first GraphQL decorators (`@ObjectType`, `@InputType`, `@Field`, `@Query`, `@Mutation`).
- Do not manually edit generated schema output in `src/schema.gql` unless the user specifically asks for generated artifact changes.
- If a schema change is expected, run the app or build path that regenerates `src/schema.gql`, then review the generated diff.
- Keep resolver method names stable unless changing the public API intentionally.

## Database Rules

- When adding an entity, register it in `DatabaseModule` and export it from `src/modules/database/entities/index.ts`.
- When changing persistent schema, add a dated SQL migration under `db/migrations/`.
- Include a rollback migration when the surrounding migration pattern includes one or when the change is risky.
- Keep entity decorators, GraphQL decorators, and migrations aligned.
- Avoid relying on TypeORM `synchronize` for shared or production database changes.
- Keep `db/schema-from-entities.sql` and `db/seed-sample-data.sql` aligned with the active entities. They should not recreate removed tables.
- Historical migrations can reference old tables, but current application code and fresh-database SQL should match the current model.

## Testing Guidance

- Jest unit tests live next to source as `*.spec.ts` under `src/`.
- E2E tests use `test/jest-e2e.json`.
- For service changes, mock repositories with the minimal TypeORM methods needed by the test.
- Prefer focused tests that cover behavior and error cases over broad implementation snapshots.
- Run the smallest relevant test first, then `npm test` or `npm run build` when the change has broader impact.

## Agent Workflow

- Inspect existing files before editing; follow local style over introducing new abstractions.
- Keep edits scoped to the requested behavior.
- Do not modify `.env`, generated output, `dist/`, or `node_modules/`.
- Do not overwrite user work. Check `git status --short` before and after non-trivial edits.
- If a command rewrites files, mention it in the final response.
- For user-facing behavior changes, report the exact verification command run and whether it passed.
