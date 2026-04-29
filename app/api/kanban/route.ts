import { NextResponse } from "next/server";
import { openKanbanStore } from "@/lib/kanban-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return withStore((store) => NextResponse.json(store.getBoard()));
}

export async function POST(request: Request) {
  return withStore(async (store) => {
    const input = await request.json();
    return NextResponse.json(store.createCard(input), { status: 201 });
  });
}

async function withStore<T>(
  action: (store: ReturnType<typeof openKanbanStore>) => T | Promise<T>,
) {
  // Each request opens a short-lived SQLite connection and initializes safely.
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
