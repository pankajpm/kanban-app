import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DELETE, PATCH } from "../app/api/kanban/cards/[id]/route";
import { GET, POST } from "../app/api/kanban/route";

let tempDirectory = "";

beforeEach(() => {
  // API tests use a real temporary SQLite file to verify request-to-request persistence.
  tempDirectory = mkdtempSync(join(tmpdir(), "kanban-api-"));
  process.env.SQLITE_PATH = join(tempDirectory, "kanban.sqlite");
});

afterEach(() => {
  delete process.env.SQLITE_PATH;
  rmSync(tempDirectory, { recursive: true, force: true });
});

function jsonRequest(body: unknown): Request {
  // Route handlers consume standard Request objects in direct tests.
  return new Request("http://localhost/api/kanban", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function routeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function responseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

describe("kanban API persistence", () => {
  it("loads columns and cards from the database-backed route", async () => {
    const response = await GET();
    const board = await responseJson<{
      columns: unknown[];
      cards: unknown[];
    }>(response);

    expect(response.ok).toBe(true);
    expect(board.columns).toHaveLength(3);
    expect(board.cards).toEqual([]);
  });

  it("persists created cards across requests", async () => {
    const createResponse = await POST(
      jsonRequest({
        id: "api-card",
        title: "Persist me",
        description: "",
        column: "todo",
      }),
    );
    const boardResponse = await GET();
    const board = await responseJson<{ cards: { id: string; description: string }[] }>(
      boardResponse,
    );

    expect(createResponse.ok).toBe(true);
    expect(board.cards).toEqual([
      {
        id: "api-card",
        title: "Persist me",
        description: "No details added yet.",
        column: "todo",
      },
    ]);
  });

  it("persists moved cards across requests", async () => {
    await POST(jsonRequest({ id: "api-card", title: "Move me", column: "todo" }));

    const moveResponse = await PATCH(
      jsonRequest({ column: "done" }),
      routeContext("api-card"),
    );
    const board = await responseJson<{ cards: { column: string }[] }>(await GET());

    expect(moveResponse.ok).toBe(true);
    expect(board.cards[0]?.column).toBe("done");
  });

  it("persists deleted cards across requests", async () => {
    await POST(jsonRequest({ id: "api-card", title: "Delete me", column: "todo" }));

    const deleteResponse = await DELETE(new Request("http://localhost"), routeContext("api-card"));
    const board = await responseJson<{ cards: unknown[] }>(await GET());

    expect(deleteResponse.ok).toBe(true);
    expect(board.cards).toEqual([]);
  });

  it("returns an error response when a write fails", async () => {
    const response = await POST(
      jsonRequest({
        id: "bad-card",
        title: "Bad",
        column: "missing",
      }),
    );
    const body = await responseJson<{ error: string }>(response);

    expect(response.ok).toBe(false);
    expect(body.error).toBeTruthy();
  });
});
