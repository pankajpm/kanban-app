# Kanban App

A simple single-page Kanban board built with Next.js. Users can create cards, drag cards between the fixed `To Do`, `In Progress`, and `Done` columns, delete cards, and switch between light and dark themes.

Card and column data is persisted in SQLite through Next.js route handlers. On first run the app creates the database schema and default columns, but it does not seed sample cards.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- SQLite via `better-sqlite3`
- Vitest, React Testing Library, and jsdom

## Local Setup

Use Node.js 22, matching the CI workflow.

```bash
npm ci
npm run dev
```

The development server starts at `http://localhost:3000` by default.

SQLite uses `data/kanban.sqlite` by default. To use a different database file, set `SQLITE_PATH` or `DATABASE_URL`; `DATABASE_URL` may use a `file:` prefix.

```bash
SQLITE_PATH=/tmp/kanban.sqlite npm run dev
```

## Available Scripts

- `npm run dev` - start the Next.js development server.
- `npm run build` - create a production build.
- `npm run start` - start the production server after building.
- `npm run test` - run the Vitest test suite once.
- `npm run test:watch` - run Vitest in watch mode.
- `npm run typecheck` - generate Next.js types and run TypeScript with `--noEmit`.
- `npm run test:all` - run type checking and the test suite.

## Testing

Run the full local verification suite with:

```bash
npm run test:all
```

Tests cover the SQLite store, API route persistence, the Kanban page behavior, and small UI primitives. API tests use temporary SQLite files, while store tests use in-memory SQLite databases.
