import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import {
  createKanbanStore,
  DEFAULT_COLUMNS,
  type KanbanStore,
} from "../lib/kanban-store";

function createMemoryStore(seedDefaults = true): KanbanStore {
  // Tests use SQLite's in-memory mode so persistence behavior is isolated.
  const db = new Database(":memory:");
  const store = createKanbanStore(db, { seedDefaults });
  store.initialize();
  return store;
}

describe("kanban SQLite store setup", () => {
  it("creates schema and exactly the default columns on first setup", () => {
    const store = createMemoryStore();

    const board = store.getBoard();

    expect(board.columns).toEqual(DEFAULT_COLUMNS);
    expect(board.cards).toEqual([]);
  });

  it("does not seed sample cards on first setup", () => {
    const store = createMemoryStore();

    expect(store.getBoard().cards).toHaveLength(0);
  });

  it("does not re-seed or overwrite existing database data", () => {
    const db = new Database(":memory:");
    const firstStore = createKanbanStore(db, { seedDefaults: true });
    firstStore.initialize();
    firstStore.updateColumn("todo", {
      title: "Backlog",
      description: "Custom persisted metadata.",
    });
    firstStore.createCard({
      id: "persisted-card",
      title: "Keep me",
      description: "Existing user data",
      column: "todo",
    });

    const reopenedStore = createKanbanStore(db, { seedDefaults: false });
    reopenedStore.initialize();

    expect(reopenedStore.getBoard().columns[0]).toEqual({
      id: "todo",
      title: "Backlog",
      description: "Custom persisted metadata.",
    });
    expect(reopenedStore.getBoard().cards).toHaveLength(1);
  });

  it("rejects cards with invalid column ids", () => {
    const store = createMemoryStore();

    expect(() =>
      store.createCard({
        id: "bad-column",
        title: "Invalid",
        description: "Should fail",
        column: "missing",
      }),
    ).toThrow();
  });
});

describe("kanban card CRUD", () => {
  it("creates and reads persisted cards", () => {
    const store = createMemoryStore();

    const card = store.createCard({
      id: "card-1",
      title: "Write tests",
      description: "Start red",
      column: "todo",
    });

    expect(card).toEqual({
      id: "card-1",
      title: "Write tests",
      description: "Start red",
      column: "todo",
    });
    expect(store.getBoard().cards).toEqual([card]);
  });

  it("updates card title, description, and column", () => {
    const store = createMemoryStore();
    store.createCard({
      id: "card-1",
      title: "Old",
      description: "Old description",
      column: "todo",
    });

    const updated = store.updateCard("card-1", {
      title: "New",
      description: "New description",
      column: "doing",
    });

    expect(updated).toEqual({
      id: "card-1",
      title: "New",
      description: "New description",
      column: "doing",
    });
  });

  it("persists moving a card to another column", () => {
    const store = createMemoryStore();
    store.createCard({
      id: "card-1",
      title: "Move me",
      description: "Drag target",
      column: "todo",
    });

    store.updateCard("card-1", { column: "done" });

    expect(store.getBoard().cards[0]?.column).toBe("done");
  });

  it("deletes persisted cards", () => {
    const store = createMemoryStore();
    store.createCard({
      id: "card-1",
      title: "Delete me",
      description: "Cleanup",
      column: "todo",
    });

    store.deleteCard("card-1");

    expect(store.getBoard().cards).toEqual([]);
  });
});

describe("kanban column metadata", () => {
  it("reads columns in fixed product order", () => {
    const store = createMemoryStore();

    expect(store.getBoard().columns.map((column) => column.id)).toEqual([
      "todo",
      "doing",
      "done",
    ]);
  });

  it("updates column title and description without changing id", () => {
    const store = createMemoryStore();

    const column = store.updateColumn("doing", {
      title: "Active",
      description: "Work in progress.",
    });

    expect(column).toEqual({
      id: "doing",
      title: "Active",
      description: "Work in progress.",
    });
  });
});
