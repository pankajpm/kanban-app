import { NextResponse } from "next/server";
import { openKanbanStore, type ColumnId } from "@/lib/kanban-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withStore(async (store) => {
    const input = await request.json();
    return NextResponse.json(store.updateColumn(parseColumnId(id), input));
  });
}

async function withStore<T>(
  action: (store: ReturnType<typeof openKanbanStore>) => T | Promise<T>,
) {
  // Column metadata uses the same initialized store as cards.
  const store = openKanbanStore();
  try {
    store.initialize();
    return await action(store);
  } catch (error) {
    return errorResponse(error);
  } finally {
    store.close();
  }
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected database error.";
  return NextResponse.json({ error: message }, { status: 400 });
}

function parseColumnId(id: string): ColumnId {
  // Dynamic route params are strings, so validate before using the fixed enum.
  if (id === "todo" || id === "doing" || id === "done") {
    return id;
  }

  throw new Error(`Column not found: ${id}`);
}
