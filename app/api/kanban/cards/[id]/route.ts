import { NextResponse } from "next/server";
import { openKanbanStore } from "@/lib/kanban-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withStore(async (store) => {
    const input = await request.json();
    return NextResponse.json(store.updateCard(id, input));
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return withStore((store) => {
    store.deleteCard(id);
    return new NextResponse(null, { status: 204 });
  });
}

async function withStore<T>(
  action: (store: ReturnType<typeof openKanbanStore>) => T | Promise<T>,
) {
  // Each mutation owns its connection so file-backed and test DBs behave alike.
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
