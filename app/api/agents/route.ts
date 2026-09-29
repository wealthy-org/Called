import { NextResponse } from "next/server";
import { validateAgentInput } from "@/lib/byok";
import { listAgents, registerAgent, sealCountsByOwner } from "@/lib/agent-store";
import { readSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "sign in to view agents" }, { status: 401 });
  }
  const agents = await listAgents(session.address);
  const sealCounts = await sealCountsByOwner(session.address);
  const withCounts = agents.map((agent) => ({
    ...agent,
    sealCount: sealCounts[agent.id] ?? 0,
  }));
  return NextResponse.json({ agents: withCounts, count: withCounts.length });
}

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "sign in to register an agent" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const record = body as Record<string, unknown>;

  const validated = validateAgentInput({
    name: record.name,
    model: record.model,
    providerEndpoint: record.providerEndpoint,
    promptHash: record.promptHash,
  });
  if (!validated.ok) {
    return NextResponse.json({ error: validated.reason }, { status: 400 });
  }

  const agent = await registerAgent({
    ownerWallet: session.address,
    name: validated.value.name,
    model: validated.value.model,
    providerEndpoint: validated.value.providerEndpoint,
    promptHash: validated.value.promptHash,
  });

  return NextResponse.json({ agent }, { status: 201 });
}
