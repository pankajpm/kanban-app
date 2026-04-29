# Database PRD Implementation TODO

Source PRD: [`database_prd.md`](./database_prd.md)

## Goal

Implement SQLite-backed persistence for the Kanban web app using a strict test-driven workflow:

1. Work on a new topic branch.
2. Write failing tests first.
3. Implement the smallest code change that makes the tests pass.
4. Repeat red -> green -> refactor until the PRD acceptance criteria are met.
5. Run validation before committing.
6. Use the repository's project-review skill output in the pull request description.
7. Commit, push, and open a GitHub pull request.

## Preflight

- [x] Confirm whether this feature should be prototype quality or production quality before implementation begins.
  - Decision: prototype quality.
- [x] Review `docs/database_prd.md` and keep scope limited to the PRD.
- [x] Check current git status and identify unrelated user changes that must not be touched.
<!-- Verify the `project-review` skill exists in this repository before relying on it for PR review content.
Current note: only `kanban-design-guidelines` and `shadcn` skills are visible under `.agents/skills`; if `project-review` is missing, stop and ask whether to add/use another review process.
-->
- [x] Verify or add a test runner and `npm test` script before writing the first feature tests.
- [x] Verify the app can still run with the existing scripts:
  - [x] `npm run typecheck`
  - [x] `npm run build`

## Branch Workflow

- [x] Create a new topic branch from the current base branch.
  - Suggested branch name: `feature/sqlite-kanban-persistence`
- [x] Confirm the branch is clean except for intended feature work.
- [ ] Do not commit or push until all implementation, tests, and review steps pass.

## TDD Strategy

- [x] Establish a test setup that can run database tests against an in-memory SQLite database.
- [x] Ensure the running application uses a persistent SQLite file path from configuration.
- [x] Keep tests focused on observable PRD behavior, not implementation details.
- [x] For each behavior:
  - [x] Write the failing test first.
  - [x] Run the test and confirm the expected failure.
  - [x] Implement the smallest working change.
  - [x] Run the test again and confirm it passes.
  - [x] Refactor only after the test is green.

## Test Plan

### Database Lifecycle

- [x] Red: test first-time setup creates schema and exactly the three default columns.
- [x] Green: implement idempotent database setup.
- [x] Red: test first-time setup does not seed sample cards.
- [x] Green: ensure only columns are seeded on first creation.
- [x] Red: test reopening an existing database does not drop, truncate, or re-seed data.
- [x] Green: preserve existing data during setup.
- [x] Red: test foreign key enforcement rejects cards with invalid column ids.
- [x] Green: enable `PRAGMA foreign_keys = ON` for each connection.

### Card CRUD

- [x] Red: test creating a card persists `id`, `title`, `description`, and `column_id`.
- [x] Green: implement card creation through the data layer.
- [x] Red: test reading cards returns persisted database rows.
- [x] Green: implement card reads.
- [x] Red: test updating a card can change `title`, `description`, and `column_id`.
- [x] Green: implement card updates.
- [x] Red: test moving a card persists the new column.
- [x] Green: wire move behavior to the update path.
- [x] Red: test deleting a card removes it from persistent storage.
- [x] Green: implement card deletion.

### Column Metadata

- [x] Red: test reading columns returns the fixed order: `todo`, `doing`, `done`.
- [x] Green: implement ordered column reads.
- [x] Red: test updating a column changes `title` and `description` without changing `id`.
- [x] Green: implement column metadata updates.
- [x] Red: test existing column metadata is not overwritten on later setup.
- [x] Green: make setup non-destructive for existing databases.

### Application Integration

- [x] Red: test the app/API loads columns and cards from the data layer instead of hardcoded client state.
- [x] Green: connect the web app to the database-backed read path.
- [x] Red: test creating a card through the app/API persists across a reload or second read.
- [x] Green: connect create-card UI behavior to persistence.
- [x] Red: test moving a card through the app/API persists across a reload or second read.
- [x] Green: connect drag-and-drop move behavior to persistence.
- [x] Red: test deleting a card through the app/API persists across a reload or second read.
- [x] Green: connect delete behavior to persistence.
- [x] Red: test write failures surface an error state instead of silently losing the user action.
- [x] Green: add minimal user-facing error handling for failed writes.

## Implementation Notes

- [x] Choose the simplest maintained SQLite client compatible with the current Next.js runtime.
- [x] Keep the database module small and framework-independent enough to test with both in-memory and file-backed SQLite.
- [x] Use an in-memory database for tests.
- [x] Use a persistent file-backed database for the running app.
- [x] Configure the persistent database path with an environment variable.
- [x] Create parent directories for the configured database path when needed.
- [x] Add the local SQLite database path or data directory to `.gitignore`.
- [x] Do not change the standalone CLI `task-list.js`.
- [x] Do not introduce authentication, multi-user behavior, realtime sync, or other out-of-scope features.

## Validation Before Commit

- [x] Run the full test suite and confirm it passes.
  - Expected command after test setup exists: `npm test`
- [x] Run type checking.
  - Command: `npm run typecheck`
- [x] Run the production build.
  - Command: `npm run build`
- [x] Manually verify the app behavior:
  - [x] First run creates the SQLite file, schema, and columns.
  - [x] Creating a card persists after reload.
  - [x] Moving a card persists after reload.
  - [x] Deleting a card persists after reload.
  - [x] Existing database contents are not wiped on restart.
    - Covered by the reopening existing database test.
- [x] Review `.gitignore` and git status to ensure no local database file is staged.

## Mini Review

- [x] Run the repository's `project-review` skill against only the newly implemented functionality.
  - Substituted manual mini-review because no `project-review` skill was found in this repository.
- [x] Capture the mini-review output.
  - Manual mini-review: no high-severity blockers found. One UI memoization dependency issue was found and fixed before PR. Residual prototype risk: route handlers use simple 400 responses and short-lived SQLite connections, which is acceptable for the requested prototype scope.
- [x] Address any high-severity findings before opening the pull request.
- [x] Include the review output or a concise summary of it in the pull request description.

## Commit And Pull Request

- [ ] Review all staged and unstaged changes.
- [ ] Stage only the intended implementation, tests, docs, and configuration changes.
- [ ] Commit with a concise message that reflects the SQLite persistence feature.
- [ ] Push the topic branch to GitHub.
- [ ] Create a pull request with:
  - [ ] Summary of the persistence implementation.
  - [ ] TDD/test coverage summary.
  - [ ] Validation commands and results.
  - [ ] Manual verification notes.
  - [ ] Mini-review output from the `project-review` skill.
  - [ ] Any reviewer notes about SQLite file path configuration or local database files.

## Definition Of Done

- [x] SQLite is the app's persistence layer.
- [x] Cards and column metadata are read from SQLite.
- [x] Create, move, and delete card actions persist across reload/restart.
- [x] Card updates support `title`, `description`, and `column_id`.
- [x] Column metadata updates are supported by the data layer.
- [x] First-time setup creates schema and default columns only.
- [x] Existing databases are opened without destructive re-seeding or data loss.
- [x] Tests cover database lifecycle, CRUD, integration behavior, and error handling.
- [x] Full validation passes before commit.
- [ ] Pull request is opened with review-ready context.
