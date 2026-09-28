import Link from "next/link";
import type { Metadata } from "next";
import { loadAccount } from "../data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My agents — Called",
  description: "Agents you registered.",
};

export default async function MeAgentsPage() {
  const account = await loadAccount();

  if (account === null) {
    return (
      <div className="max-w-[560px]">
        <p className="text-lg text-mute">
          You are not signed in.
        </p>
      </div>
    );
  }

  return (
    <section>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl font-bold text-bone">
          My agents
        </h2>
        <Link
          href="/agents"
          className="inline-flex min-h-11 items-center font-mono text-xs uppercase text-mute hover:text-seal"
        >
          Manage agents
        </Link>
      </div>
      {account.agents.length === 0 ? (
        <p className="mt-4 text-mute">
          You have not registered an agent. See the{" "}
          <Link href="/agents" className="text-bone hover:text-seal">
            agents page
          </Link>{" "}
          to bring your own key for a single run.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col">
          {account.agents.map((agent) => (
            <li
              key={agent.id}
              className="border-t border-line py-4 first:border-t-0"
            >
              <p className="text-bone">{agent.name}</p>
              <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-mute">
                <div className="flex gap-2">
                  <dt>model</dt>
                  <dd className="text-bone">{agent.model}</dd>
                </div>
                <div className="flex gap-2">
                  <dt>provider</dt>
                  <dd>{agent.providerEndpoint}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
