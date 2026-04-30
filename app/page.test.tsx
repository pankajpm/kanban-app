import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BoardData, ColumnId } from "@/lib/kanban-store";
import Home from "./page";

type CreateCardBody = {
  title: string;
  description: string;
  column: ColumnId;
};

function createBoard(): BoardData {
  // Keep page tests focused on UI behavior while matching the API contract.
  return {
    columns: [
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
    ],
    cards: [
      {
        id: "sample-1",
        title: "Create sample data",
        description: "Seed the first board state.",
        column: "todo",
      },
      {
        id: "sample-2",
        title: "Add draggable cards",
        description: "Move work across the board.",
        column: "doing",
      },
      {
        id: "sample-3",
        title: "Sketch board layout",
        description: "Keep the interface simple.",
        column: "done",
      },
    ],
  };
}

function mockKanbanApi() {
  // The client component talks to fetch, so tests stub those calls directly.
  const board = createBoard();
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url === "/api/kanban" && method === "POST") {
      const body = JSON.parse(String(init?.body ?? "{}")) as CreateCardBody;
      const newCard = {
        id: "new-card",
        title: body.title,
        description: body.description,
        column: body.column,
      };
      board.cards = [newCard, ...board.cards];
      return jsonResponse(newCard);
    }

    if (url.startsWith("/api/kanban/cards/") && method === "DELETE") {
      const cardId = url.replace("/api/kanban/cards/", "");
      board.cards = board.cards.filter((card) => card.id !== cardId);
      return new Response(null, { status: 204 });
    }

    return jsonResponse(board);
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function jsonResponse<T>(body: T) {
  // Return real Response objects so fetchJson exercises status/body handling.
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status: 200,
  });
}

describe("Kanban home page", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the starter board columns and sample cards", async () => {
    mockKanbanApi();
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: "Plan, move, and finish work on one board.",
      }),
    ).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "To Do" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "In Progress" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Done" })).toBeInTheDocument();
    expect(screen.getByText("Create sample data")).toBeInTheDocument();
    expect(screen.getByText("Add draggable cards")).toBeInTheDocument();
    expect(screen.getByText("Sketch board layout")).toBeInTheDocument();
  });

  it("adds a new card to the selected column and resets the form", async () => {
    const user = userEvent.setup();
    mockKanbanApi();
    render(<Home />);

    await screen.findByRole("heading", { name: "Done" });
    await user.type(screen.getByLabelText("Card title"), "Review test coverage");
    await user.type(screen.getByLabelText("Card description"), "Check the first suite.");
    await user.selectOptions(screen.getByLabelText("Column"), "done");
    await user.click(screen.getByRole("button", { name: "Add card" }));

    expect(await screen.findByText("Review test coverage")).toBeInTheDocument();
    expect(screen.getByText("Check the first suite.")).toBeInTheDocument();
    expect(screen.getByLabelText("Card title")).toHaveValue("");
    expect(screen.getByLabelText("Card description")).toHaveValue("");
    expect(screen.getByLabelText("Column")).toHaveValue("todo");
  });

  it("does not add a card when the title is blank", async () => {
    const user = userEvent.setup();
    const fetchMock = mockKanbanApi();
    render(<Home />);

    await screen.findByRole("heading", { name: "To Do" });
    await user.type(screen.getByLabelText("Card description"), "Description without a title.");
    await user.click(screen.getByRole("button", { name: "Add card" }));

    expect(screen.queryByText("Description without a title.")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("deletes an existing card from the board", async () => {
    const user = userEvent.setup();
    mockKanbanApi();
    render(<Home />);

    await screen.findByText("Create sample data");
    await user.click(
      screen.getByRole("button", { name: "Delete Create sample data" }),
    );

    await waitFor(() => {
      expect(screen.queryByText("Create sample data")).not.toBeInTheDocument();
    });
  });
});
