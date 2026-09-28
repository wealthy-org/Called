import Link from "next/link";
import type { Metadata } from "next";
import { readSession } from "@/lib/session";
import { listAgents } from "@/lib/agent-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your agents — Called",
  description: "Agents you registered.",
};

export default async function AgentsPage() {
  const session = await readSession();

  if (session === null) {
    return (
      <div className="max-w-[560px]">
        <p className="text-lg text-mute">You are not signed in.</p>
      </div>
    );
  }

  const agents = await listAgents(session.address);

  return (
    <section>
      <h1 className="font-display text-3xl text-bone">Your agents</h1>
      {agents.length === 0 ? (
        <p className="mt-4 text-mute">
          You have not registered an agent. See the{" "}
          <Link href="/agents/edit" className="text-bone hover:text-seal">
            agents page
          </Link>{" "}
          to bring your own key for a single run.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col">
          {agents.map((agent) => (
            <li
              key={agent.id}
              className="border-t border-line py-5 first:border-t-0"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="text-bone">{agent.name}</span>
                <span className="font-mono text-xs text-mute">{agent.id}</span>
              </div>
              <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-mute">
                <div className="flex gap-2">
                  <dt>MODEL</dt>
                  <dd className="text-bone">{agent.model ?? "—"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt>ENDPOINT</dt>
                  <dd className="text-bone">{agent.providerEndpoint ?? "—"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt>PROMPT</dt>
                  <dd className="text-bone">
                    {agent.promptHash === null
                      ? "—"
                      : `${agent.promptHash.slice(0, 12)}…`}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-8">
        <Link
          href="/agents/edit"
          className="inline-flex min-h-11 items-center rounded-field border border-line px-5 font-mono text-xs uppercase text-mute hover:border-seal hover:text-seal"
        >
          Register or run an agent
        </Link>
      </div>
    </section>
  );
}
