"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ColumnId = "todo" | "doing" | "done";

type KanbanCard = {
  id: string;
  title: string;
  description: string;
  column: ColumnId;
};

type Column = {
  id: ColumnId;
  title: string;
  description: string;
};

const columns: Column[] = [
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

const sampleCards: KanbanCard[] = [
  {
    id: "sample-1",
    title: "Sketch board layout",
    description: "Create a clean three-column Kanban board.",
    column: "done",
  },
  {
    id: "sample-2",
    title: "Add draggable cards",
    description: "Let users move cards between workflow columns.",
    column: "doing",
  },
  {
    id: "sample-3",
    title: "Create sample data",
    description: "Pre-populate the board so the app feels alive.",
    column: "todo",
  },
  {
    id: "sample-4",
    title: "Support quick cleanup",
    description: "Allow cards to be deleted from any column.",
    column: "todo",
  },
];

export default function Home() {
  const [cards, setCards] = useState<KanbanCard[]>(sampleCards);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetColumn, setTargetColumn] = useState<ColumnId>("todo");
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);

  const cardsByColumn = useMemo(() => {
    return columns.reduce<Record<ColumnId, KanbanCard[]>>(
      (grouped, column) => {
        grouped[column.id] = cards.filter((card) => card.column === column.id);
        return grouped;
      },
      { todo: [], doing: [], done: [] },
    );
  }, [cards]);

  function createCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    const newCard: KanbanCard = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      description: description.trim() || "No details added yet.",
      column: targetColumn,
    };

    setCards((currentCards) => [newCard, ...currentCards]);
    setTitle("");
    setDescription("");
    setTargetColumn("todo");
  }

  function deleteCard(cardId: string) {
    setCards((currentCards) => currentCards.filter((card) => card.id !== cardId));
  }

  function moveCard(cardId: string, column: ColumnId) {
    setCards((currentCards) =>
      currentCards.map((card) =>
        card.id === cardId ? { ...card, column } : card,
      ),
    );
  }

  return (
    <main className="page-shell">
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
          >
            {columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.title}
              </option>
            ))}
          </select>
          <Button type="submit">Add card</Button>
        </form>
      </section>

      <section className="board" aria-label="Kanban board">
        {columns.map((column) => (
          <div
            className="column"
            key={column.id}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const cardId = event.dataTransfer.getData("text/plain");
              if (cardId) {
                moveCard(cardId, column.id);
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
                    onClick={() => deleteCard(card.id)}
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
