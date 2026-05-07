# Kanban App

A small single-page Kanban board built with Next.js. The app lets users create cards, delete cards, and drag cards between the fixed `To Do`, `In Progress`, and `Done` columns. Board data is served through Next.js API route handlers and persisted in SQLite.

## Tech Stack

- Next.js 16 with the App Router
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

The app uses `data/kanban.sqlite` by default. The database directory and file are created automatically on first use and are ignored by Git. To use a different database file, set `SQLITE_PATH` or `DATABASE_URL`; `file:` prefixes are supported.

## Available Scripts

- `npm run dev` - start the Next.js development server.
- `npm run build` - create a production build.
- `npm run start` - start the production server after a build.
- `npm run test` - run the Vitest suite once.
- `npm run test:watch` - run Vitest in watch mode.
- `npm run typecheck` - generate Next.js types and run TypeScript without emitting files.
- `npm run test:all` - run type checking and the test suite.

## Testing

Run the full validation used by CI:

```bash
npm run test:all
```

The tests cover the SQLite store, API route persistence, the main Kanban page, shared UI primitives, and the theme toggle. API tests use a temporary SQLite file, while store tests use in-memory SQLite.
