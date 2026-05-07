# Kanban App

A simple single-page Kanban board built with Next.js. Users can create cards, delete cards, and drag cards between the fixed `To Do`, `In Progress`, and `Done` columns. Card and column data is persisted in SQLite through the app's API routes.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- SQLite via `better-sqlite3`
- Vitest, Testing Library, and jsdom

## Local Setup

Install dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

By default, the app creates and uses `data/kanban.sqlite`. To use another SQLite file, set `SQLITE_PATH` or `DATABASE_URL` before starting the app:

```bash
SQLITE_PATH=/tmp/kanban.sqlite npm run dev
```

The database schema and default columns are initialized automatically when API routes open the store.

## Available Scripts

- `npm run dev` - start the Next.js development server.
- `npm run build` - create a production build.
- `npm run start` - run the production server after building.
- `npm run test` - run the Vitest suite once.
- `npm run test:watch` - run Vitest in watch mode.
- `npm run typecheck` - generate Next.js types and run TypeScript with `--noEmit`.
- `npm run test:all` - run type checking and the test suite.

## Testing

Run the full validation used by CI:

```bash
npm run test:all
```

Tests cover the UI primitives, the Kanban page behavior, the SQLite-backed store, and the API route persistence flow. API tests use temporary SQLite files via `SQLITE_PATH`; store tests use in-memory SQLite.

## Project Structure

- `app/page.tsx` - client-side Kanban board UI.
- `app/api/kanban/**/route.ts` - API routes for loading the board, creating cards, updating cards, deleting cards, and updating columns.
- `lib/kanban-store.ts` - SQLite schema setup and Kanban data access.
- `components/ui/` - small local UI primitives used by the board.
- `test/` and `*.test.tsx` - Vitest coverage for store, API, and UI behavior.
