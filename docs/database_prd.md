# Database Persistence — Product Requirements Document

**Status:** Draft  
**Scope:** Kanban web app only (`app/page.tsx` data and behaviors). Excludes the standalone CLI (`task-list.js`).  
**Database:** **SQLite** — single-file relational store for all persisted data.

---

## 1. Purpose

Persist **all user-visible Kanban content** and the **actions** that mutate it so that after reload, restart, or redeploy, the app reflects the same data stored in a database. Users must be able to **create, read, update, and delete** that content through the database layer.

---

## 2. Goals

- **SQLite as the store:** Use SQLite for persistence (no alternate primary database).
- **Single source of truth:** Cards and column metadata live in SQLite; the UI loads from and writes to that store.
- **Full CRUD:** Support create, read, update, and delete for persisted entities as defined below.
- **Idempotent database setup:** If the SQLite database file does not exist, create it (and required schema). If it already exists, **only open it and perform CRUD** — do not drop, recreate, or bulk re-seed existing data.
- **No scope creep:** Do not add features beyond persisting what the app already models and does today.

---

## 3. Out of scope

- User accounts, authentication, authorization, multi-tenant isolation.
- Real-time collaboration, offline sync, or conflict resolution beyond normal DB transactions.
- Changing the CLI tool or sharing its `.tasks.json` store with the Kanban app.
- Choosing a non-SQLite primary database (Postgres, hosted DB, etc.) — out of scope unless product direction changes.
- Deployment-specific runbooks beyond noting that SQLite is a **file path** configured via env (see §7).

---

## 4. Current application model (baseline)

The UI today uses React state with these types:

| Entity | Fields | Notes |
|--------|--------|--------|
| **ColumnId** | `"todo" \| "doing" \| "done"` | Fixed enum in the product; stored as durable metadata. |
| **KanbanCard** | `id`, `title`, `description`, `column` | `id` is a string (e.g. UUID). `column` references `ColumnId`. |
| **Column** | `id`, `title`, `description` | Three columns; today hardcoded in code; must be persistable for titles/descriptions. |

**User-facing actions to persist:**

| Action | Effect |
|--------|--------|
| Create card | New row with generated `id`, user-provided `title`/`description` (with current empty-description fallback), chosen `column`. |
| List / group cards | Read all cards; group by `column` for display order (see §6). |
| Move card | Update card’s `column` (drag-and-drop). |
| Delete card | Remove row by `id`. |

**Update behavior:** The UI may only expose move/delete today, but persistence must support **updating any stored field** (`title`, `description`, `column`) so future or parallel clients can edit content without schema changes.

---

## 5. Data to persist (logical model)

### 5.1 Column (metadata)

- **id** — Primary key; one of `todo`, `doing`, `done` (stable identifiers).
- **title** — Display name (e.g. "To Do").
- **description** — Short description shown in the column header area.

**Rules:**

- Exactly three rows for the three `ColumnId` values when the schema is first created (see §7.2 vs. §7.3).
- **If the database already exists:** Do not insert default columns automatically; read and use what is stored. Migrations may add missing tables/columns but must not overwrite existing column titles/descriptions.

### 5.2 Card

- **id** — Primary key; string (UUID recommended), unique globally.
- **title** — Required in the UI when creating; stored non-empty per product rules.
- **description** — Text; may match current client default ("No details added yet.") when empty on create.
- **column_id** — Foreign key to `Column.id` (`todo` | `doing` | `done`).

### 5.3 SQLite mapping (physical model)

Implementation must map the logical model to SQLite tables (exact names are engineering convention; behavior must match §5–§6):

| Logical | SQLite guidance |
|--------|------------------|
| `Column.id` | `TEXT` primary key |
| `Column.title`, `Column.description` | `TEXT` |
| `KanbanCard.id` | `TEXT` primary key |
| `KanbanCard.title`, `description` | `TEXT` |
| `KanbanCard.column_id` | `TEXT NOT NULL` with **foreign key** to `columns(id)` |

Enable SQLite foreign key enforcement on each connection (`PRAGMA foreign_keys = ON`) so invalid `column_id` values are rejected.

---

## 6. Functional requirements

### 6.1 Create

- **Columns:** On **first-time database creation only**, insert the three default column rows with titles/descriptions matching today’s product defaults (see current constants in `app/page.tsx`). If the DB already exists, **do not** insert seed columns.
- **Cards:** Insert a new card with server- or client-generated `id`, validated `column_id`, and fields consistent with §5.2.

### 6.2 Read

- Return all columns (ordered: `todo`, then `doing`, then `done`, or by explicit `sort_order` if added in schema — **do not** add `sort_order` unless required for ordering; fixed enum order is acceptable).
- Return all cards; client may group by `column` as today.

### 6.3 Update

- **Card:** Update `title`, `description`, and/or `column_id` by `id`. Supports drag-and-drop moves (`column_id` only) and any future inline edits.
- **Column:** Update `title` and/or `description` by `id` without changing `id` values.

### 6.4 Delete

- **Card:** Delete by `id`.
- **Column:** No delete in product scope (columns are fixed by enum); implementation should not expose column delete for the three system columns.

---

## 7. Database lifecycle (SQLite)

### 7.1 Configuration

- Store location is a **filesystem path** to a `.sqlite` (or `.db`) file, supplied via configuration (e.g. environment variable such as `DATABASE_URL` with a `file:` URI, or a dedicated `SQLITE_PATH`).
- Create parent directories if required so the file can be created on first run (implementation detail).

### 7.2 Database file does not exist

- **Open** SQLite against the configured path — SQLite **creates the file** on first connection.
- **Create schema** (tables, constraints, indexes) for columns and cards.
- **Seed columns only** per §6.1 — **do not** seed sample cards; empty card set is acceptable on first run (implementation choice: load from DB only).

### 7.3 Database file already exists

- **Open** the existing SQLite file read-write.
- **Do not** delete or replace the file.
- **Do not** truncate tables or re-seed columns/cards.
- **Apply schema migrations** only if required to add missing tables/columns (additive, non-destructive). Never delete user data as part of “setup.”
- Perform **only** normal CRUD operations against existing data.

---

## 8. Non-functional requirements

- **Consistency:** Card `column_id` must reference an existing column `id` (referential integrity).
- **IDs:** Card `id` remains opaque string; uniqueness enforced in DB.
- **Errors:** Failed writes surface an error state in the UI; no silent loss of user actions (exact UX is implementation detail).

---

## 9. Suggested implementation surface (non-binding)

SQLite is required; the driver/library (e.g. `better-sqlite3`, `libsql`, or another maintained SQLite client for Node/Next.js) is an engineering choice. A typical shape:

- **Server layer:** Next.js Route Handlers or Server Actions that open a **single SQLite file** via configured path and call a small data-access module (short-lived connections or a documented pooling strategy compatible with serverless if applicable).
- **Endpoints / operations (examples):** `GET` columns + cards; `POST` card; `PATCH` card by id; `DELETE` card by id; `PATCH` column metadata by id.

Exact REST vs. RPC naming is an engineering choice; behavior must match §6–§7.

**SQLite notes:** Prefer WAL mode (`PRAGMA journal_mode = WAL`) for concurrent read/write behavior where the runtime supports it; document the database file path in `.gitignore` (or use a project-local `data/` path) so the committed repo does not ship user databases.

---

## 10. Acceptance criteria (summary)

- [ ] Persistence uses **SQLite** (single file) per configured path.
- [ ] All cards and column metadata are read from SQLite after initial setup.
- [ ] Creating, moving, and deleting cards persist and survive reload.
- [ ] Column titles/descriptions can be updated in SQLite and reflected on read (even if the UI does not yet expose editing).
- [ ] First run creates the SQLite file + schema + three column rows only; no forced sample cards from the DB layer.
- [ ] Subsequent runs open the existing SQLite file without wiping or re-seeding user data.

---

## 11. References

- Application types and constants: [`app/page.tsx`](../app/page.tsx)
- Product vision (session-state note superseded by this PRD for persistence): [`references/product.md`](../references/product.md)
