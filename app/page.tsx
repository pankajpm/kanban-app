"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type {
  BoardData,
  ColumnId,
  KanbanCard,
  KanbanColumn,
} from "@/lib/kanban-store";

export default function Home() {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetColumn, setTargetColumn] = useState<ColumnId>("todo");
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadBoard();
  }, []);

  const cardsByColumn = useMemo(() => {
    return columns.reduce<Record<ColumnId, KanbanCard[]>>(
      (grouped, column) => {
        grouped[column.id] = cards.filter((card) => card.column === column.id);
        return grouped;
      },
      { todo: [], doing: [], done: [] },
    );
  }, [cards, columns]);

  async function loadBoard() {
    // Initial page load comes from SQLite through the API, not sample state.
    setIsLoading(true);
    try {
      const board = await fetchJson<BoardData>("/api/kanban");
      setColumns(board.columns);
      setCards(board.cards);
      setError(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }

  async function createCard(event: FormEvent<HTMLFormElement>) {
    // Create through the API so new cards survive refreshes and restarts.
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    try {
      const newCard = await fetchJson<KanbanCard>("/api/kanban", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          description,
          column: targetColumn,
        }),
      });
      setCards((currentCards) => [newCard, ...currentCards]);
      setTitle("");
      setDescription("");
      setTargetColumn("todo");
      setError(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function deleteCard(cardId: string) {
    // Deletion waits for the API so a failed write does not disappear locally.
    try {
      await fetchJson<void>(`/api/kanban/cards/${cardId}`, { method: "DELETE" });
      setCards((currentCards) =>
        currentCards.filter((card) => card.id !== cardId),
      );
      setError(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function moveCard(cardId: string, column: ColumnId) {
    // Drag-and-drop is persisted as a card column update.
    try {
      const updatedCard = await fetchJson<KanbanCard>(
        `/api/kanban/cards/${cardId}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ column }),
        },
      );
      setCards((currentCards) =>
        currentCards.map((card) =>
          card.id === cardId ? updatedCard : card,
        ),
      );
      setError(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  return (
    <main className="page-shell">
      <div className="page-header">
        <ThemeToggle />
      </div>
      <section className="hero">
        <div>
          <p className="eyebrow">Simple Kanban</p>
          <h1>Plan, move, and finish work on one board.</h1>
        </div>
        <form className="new-card-form" onSubmit={createCard}>
          <Input
            aria-label="Card title"
            placeholder="Card title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <Input
            aria-label="Card description"
            placeholder="Short description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <select
            aria-label="Column"
            value={targetColumn}
            onChange={(event) => setTargetColumn(event.target.value as ColumnId)}
            disabled={!columns.length}
          >
            {columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.title}
              </option>
            ))}
          </select>
          <Button disabled={!columns.length} type="submit">
            Add card
          </Button>
          {error ? <p className="form-error">{error}</p> : null}
        </form>
      </section>

      <section className="board" aria-label="Kanban board">
        {isLoading ? <div className="empty-state">Loading board...</div> : null}
        {columns.map((column) => (
          <div
            className="column"
            key={column.id}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const cardId = event.dataTransfer.getData("text/plain");
              if (cardId) {
                void moveCard(cardId, column.id);
              }
              setDraggingCardId(null);
            }}
          >
            <div className="column-header">
              <div>
                <h2>{column.title}</h2>
                <p>{column.description}</p>
              </div>
              <span>{cardsByColumn[column.id].length}</span>
            </div>

            <div className="card-list">
              {cardsByColumn[column.id].map((card) => (
                <Card
                  className={`task-card ${
                    draggingCardId === card.id ? "is-dragging" : ""
                  }`}
                  draggable
                  key={card.id}
                  onDragEnd={() => setDraggingCardId(null)}
                  onDragStart={(event) => {
                    setDraggingCardId(card.id);
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", card.id);
                  }}
                >
                  <div>
                    <h3>{card.title}</h3>
                    <p>{card.description}</p>
                  </div>
                  <Button
                    aria-label={`Delete ${card.title}`}
                    onClick={() => void deleteCard(card.id)}
                    type="button"
                    variant="ghost"
                  >
                    Delete
                  </Button>
                </Card>
              ))}

              {cardsByColumn[column.id].length === 0 ? (
                <div className="empty-state">Drop a card here</div>
              ) : null}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  // Shared response handling keeps write failures visible to the UI.
  const response = await fetch(url, { cache: "no-store", ...init });
  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error ?? "Request failed.");
  }

  return body as T;
}

function getErrorMessage(error: unknown) {
  // Convert unknown thrown values into one user-facing message string.
  return error instanceof Error ? error.message : "Something went wrong.";
}
