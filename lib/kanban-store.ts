import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { dirname } from "node:path";
import { existsSync, mkdirSync } from "node:fs";

export type ColumnId = "todo" | "doing" | "done";

export type KanbanColumn = {
  id: ColumnId;
  title: string;
  description: string;
};

export type KanbanCard = {
  id: string;
  title: string;
  description: string;
  column: ColumnId;
};

export type BoardData = {
  columns: KanbanColumn[];
  cards: KanbanCard[];
};

export type CreateCardInput = {
  id?: string;
  title: string;
  description?: string;
  column: ColumnId | string;
};

export type UpdateCardInput = Partial<{
  title: string;
  description: string;
  column: ColumnId | string;
}>;

export type UpdateColumnInput = Partial<{
  title: string;
  description: string;
}>;

export type KanbanStore = {
  initialize: () => void;
  getBoard: () => BoardData;
  createCard: (input: CreateCardInput) => KanbanCard;
  updateCard: (id: string, input: UpdateCardInput) => KanbanCard;
  deleteCard: (id: string) => void;
  updateColumn: (id: ColumnId, input: UpdateColumnInput) => KanbanColumn;
  close: () => void;
};

type StoreOptions = {
  seedDefaults: boolean;
};

type CardRow = {
  id: string;
  title: string;
  description: string;
  column_id: ColumnId;
};

export const DEFAULT_COLUMNS: KanbanColumn[] = [
  {
    id: "todo",
    title: "To Do",
    description: "Ideas and tasks ready to pick up.",
  },
  {
    id: "doing",
    title: "In Progress",
    description: "Work currently moving forward.",
  },
  {
    id: "done",
    title: "Done",
    description: "Completed work for this demo.",
  },
];

const DEFAULT_DATABASE_PATH = "data/kanban.sqlite";

export function getDatabasePath(): string {
  // The app uses a persistent file by default while tests pass ":memory:".
  const configuredPath =
    process.env.SQLITE_PATH ?? process.env.DATABASE_URL ?? DEFAULT_DATABASE_PATH;
  return configuredPath.startsWith("file:")
    ? configuredPath.slice("file:".length)
    : configuredPath;
}

export function openKanbanStore(databasePath = getDatabasePath()): KanbanStore {
  // Existing files must not be re-seeded because they may contain user data.
  const seedDefaults = databasePath === ":memory:" || !existsSync(databasePath);
  ensureDatabaseDirectory(databasePath);
  return createKanbanStore(new Database(databasePath), { seedDefaults });
}

export function createKanbanStore(
  db: Database.Database,
  options: StoreOptions = { seedDefaults: true },
): KanbanStore {
  return {
    initialize: () => initializeDatabase(db, options),
    getBoard: () => getBoard(db),
    createCard: (input) => createCard(db, input),
    updateCard: (id, input) => updateCard(db, id, input),
    deleteCard: (id) => deleteCard(db, id),
    updateColumn: (id, input) => updateColumn(db, id, input),
    close: () => db.close(),
  };
}

function ensureDatabaseDirectory(databasePath: string) {
  // SQLite file paths need their parent directory before the connection opens.
  if (databasePath === ":memory:" || databasePath.startsWith("file:")) {
    return;
  }

  const parentDirectory = dirname(databasePath);
  if (parentDirectory !== "." && !existsSync(parentDirectory)) {
    mkdirSync(parentDirectory, { recursive: true });
  }
}

function initializeDatabase(db: Database.Database, options: StoreOptions) {
  // Foreign keys are per-connection in SQLite, so setup enables them every time.
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS columns (
      id TEXT PRIMARY KEY CHECK (id IN ('todo', 'doing', 'done')),
      title TEXT NOT NULL,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL CHECK (length(trim(title)) > 0),
      description TEXT NOT NULL,
      column_id TEXT NOT NULL REFERENCES columns(id)
    );
  `);

  if (options.seedDefaults) {
    seedDefaultColumns(db);
  }
}

function seedDefaultColumns(db: Database.Database) {
  // INSERT OR IGNORE avoids clobbering metadata if setup runs twice in memory.
  const insertColumn = db.prepare(`
    INSERT OR IGNORE INTO columns (id, title, description)
    VALUES (@id, @title, @description)
  `);
  const seedColumns = db.transaction(() => {
    for (const column of DEFAULT_COLUMNS) {
      insertColumn.run(column);
    }
  });

  seedColumns();
}

function getBoard(db: Database.Database): BoardData {
  return {
    columns: getColumns(db),
    cards: getCards(db),
  };
}

function getColumns(db: Database.Database): KanbanColumn[] {
  return db
    .prepare(
      `
      SELECT id, title, description
      FROM columns
      ORDER BY CASE id
        WHEN 'todo' THEN 1
        WHEN 'doing' THEN 2
        WHEN 'done' THEN 3
      END
    `,
    )
    .all() as KanbanColumn[];
}

function getCards(db: Database.Database): KanbanCard[] {
  const rows = db
    .prepare(
      `
      SELECT id, title, description, column_id
      FROM cards
      ORDER BY rowid DESC
    `,
    )
    .all() as CardRow[];

  return rows.map(mapCardRow);
}

function createCard(db: Database.Database, input: CreateCardInput): KanbanCard {
  const card = normalizeNewCard(input);
  db.prepare(
    `
    INSERT INTO cards (id, title, description, column_id)
    VALUES (@id, @title, @description, @column)
  `,
  ).run(card);

  return card;
}

function updateCard(
  db: Database.Database,
  id: string,
  input: UpdateCardInput,
): KanbanCard {
  const existingCard = getCardById(db, id);
  const updatedCard = normalizeUpdatedCard(existingCard, input);

  db.prepare(
    `
    UPDATE cards
    SET title = @title, description = @description, column_id = @column
    WHERE id = @id
  `,
  ).run(updatedCard);

  return updatedCard;
}

function deleteCard(db: Database.Database, id: string) {
  db.prepare("DELETE FROM cards WHERE id = ?").run(id);
}

function updateColumn(
  db: Database.Database,
  id: ColumnId,
  input: UpdateColumnInput,
): KanbanColumn {
  const existingColumn = getColumnById(db, id);
  const updatedColumn = {
    id,
    title: input.title ?? existingColumn.title,
    description: input.description ?? existingColumn.description,
  };

  db.prepare(
    `
    UPDATE columns
    SET title = @title, description = @description
    WHERE id = @id
  `,
  ).run(updatedColumn);

  return updatedColumn;
}

function getCardById(db: Database.Database, id: string): KanbanCard {
  const row = db
    .prepare(
      `
      SELECT id, title, description, column_id
      FROM cards
      WHERE id = ?
    `,
    )
    .get(id) as CardRow | undefined;

  if (!row) {
    throw new Error(`Card not found: ${id}`);
  }

  return mapCardRow(row);
}

function getColumnById(db: Database.Database, id: ColumnId): KanbanColumn {
  const row = db
    .prepare("SELECT id, title, description FROM columns WHERE id = ?")
    .get(id) as KanbanColumn | undefined;

  if (!row) {
    throw new Error(`Column not found: ${id}`);
  }

  return row;
}

function normalizeNewCard(input: CreateCardInput): KanbanCard {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Card title is required.");
  }

  return {
    id: input.id ?? randomUUID(),
    title,
    description: input.description?.trim() || "No details added yet.",
    column: input.column as ColumnId,
  };
}

function normalizeUpdatedCard(
  existingCard: KanbanCard,
  input: UpdateCardInput,
): KanbanCard {
  const title = input.title?.trim() ?? existingCard.title;
  if (!title) {
    throw new Error("Card title is required.");
  }

  return {
    id: existingCard.id,
    title,
    description: input.description?.trim() ?? existingCard.description,
    column: (input.column ?? existingCard.column) as ColumnId,
  };
}

function mapCardRow(row: CardRow): KanbanCard {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    column: row.column_id,
  };
}
