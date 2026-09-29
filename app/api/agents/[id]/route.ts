import { NextResponse } from "next/server";
import {
  MAX_AGENT_NAME_LENGTH,
  MAX_MODEL_LENGTH,
  normalizeByokEndpoint,
} from "@/lib/byok";
import { deleteAgent, updateAgent } from "@/lib/agent-store";
import { readSession } from "@/lib/session";

export const dynamic = "force-dynamic";

function readString(body: Record<string, unknown>, key: string): string | null {
  const value = body[key];
  return typeof value === "string" ? value : null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json(
      { error: "sign in to edit an agent" },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const record = body as Record<string, unknown>;

  const updates: {
    name?: string;
    model?: string;
    providerEndpoint?: string;
    promptHash?: string | null;
  } = {};

  if ("name" in record) {
    const name = readString(record, "name")?.trim() ?? "";
    if (name.length === 0) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (name.length > MAX_AGENT_NAME_LENGTH) {
      return NextResponse.json(
        {
          error: `name must be at most ${MAX_AGENT_NAME_LENGTH} characters`,
        },
        { status: 400 },
      );
    }
    updates.name = name;
  }

  if ("model" in record) {
    const model = readString(record, "model")?.trim() ?? "";
    if (model.length === 0) {
      return NextResponse.json({ error: "model is required" }, { status: 400 });
    }
    if (model.length > MAX_MODEL_LENGTH) {
      return NextResponse.json(
        { error: `model must be at most ${MAX_MODEL_LENGTH} characters` },
        { status: 400 },
      );
    }
    updates.model = model;
  }

  if ("providerEndpoint" in record) {
    const endpoint = normalizeByokEndpoint(
      readString(record, "providerEndpoint") ?? "",
    );
    if (endpoint === null) {
      return NextResponse.json(
        { error: "providerEndpoint must be an https URL" },
        { status: 400 },
      );
    }
    updates.providerEndpoint = endpoint;
  }

  if ("promptHash" in record) {
    const raw = readString(record, "promptHash")?.trim().toLowerCase() ?? "";
    if (raw.length === 0) {
      updates.promptHash = null;
    } else if (!/^[0-9a-f]{64}$/.test(raw)) {
      return NextResponse.json(
        { error: "promptHash must be 64 hex characters" },
        { status: 400 },
      );
    } else {
      updates.promptHash = raw;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "no fields to update" },
      { status: 400 },
    );
  }

  const agent = await updateAgent(id, session.address, updates);
  if (!agent) {
    return NextResponse.json({ error: "agent not found" }, { status: 404 });
  }

  return NextResponse.json({ agent });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json(
      { error: "sign in to delete an agent" },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const result = await deleteAgent(id, session.address);

  if (!result.ok) {
    if (result.kind === "not_found") {
      return NextResponse.json({ error: "agent not found" }, { status: 404 });
    }
    if (result.kind === "has_seals") {
      return NextResponse.json(
        {
          error: "this agent has sealed predictions and cannot be deleted",
          sealCount: result.sealCount,
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "this agent has run attempts and cannot be deleted" },
      { status: 409 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
