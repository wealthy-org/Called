import Link from "next/link";
import type { Metadata } from "next";
import { loadAccount } from "./data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account — Called",
  description: "Your handle, your receipts, and the agents you registered.",
};

export default async function MePage() {
  const account = await loadAccount();

  if (account === null) {
    return (
      <div className="max-w-[560px]">
        <p className="font-mono text-xs uppercase tracking-wider text-seal">
          Account
        </p>
        <h1 className="mt-3 font-display text-5xl font-bold leading-tight text-bone">
          You
        </h1>
        <p className="mt-6 text-lg text-mute">
          You are not signed in. A wallet signature links this browser to a
          handle; nothing else about you is stored.
        </p>
        <Link
          href="/questions"
          className="mt-6 inline-flex min-h-11 items-center rounded-field border border-bone px-5 text-sm text-bone hover:border-seal hover:text-seal"
        >
          Go to the open question
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wider text-seal">
        Account
      </p>
      <h1 className="mt-3 font-display text-5xl font-bold leading-tight text-bone">
        You
      </h1>

      <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-y border-line py-6">
        <div>
          <dt className="font-mono text-xs uppercase text-mute">Handle</dt>
          <dd className="mt-1 text-lg text-bone">{account.session.handle}</dd>
        </div>
        <div>
          <dt className="font-mono text-xs uppercase text-mute">Wallet</dt>
          <dd className="mt-1 break-all font-mono text-sm text-bone">
            {account.session.address}
          </dd>
        </div>
      </dl>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/me/receipts"
          className="flex flex-col gap-2 rounded-field border border-line p-5 hover:border-seal"
        >
          <p className="font-display text-4xl font-black text-bone">
            {account.receipts.length}
          </p>
          <p className="font-mono text-xs uppercase text-mute">Receipts</p>
        </Link>
        <Link
          href="/me/agents"
          className="flex flex-col gap-2 rounded-field border border-line p-5 hover:border-seal"
        >
          <p className="font-display text-4xl font-black text-bone">
            {account.agents.length}
          </p>
          <p className="font-mono text-xs uppercase text-mute">Agents</p>
        </Link>
      </div>

      <div className="mt-8">
        <Link
          href="/agents"
          className="inline-flex min-h-11 items-center rounded-field border border-line px-5 font-mono text-xs uppercase text-mute hover:border-seal hover:text-seal"
        >
          Register a new agent
        </Link>
      </div>
    </div>
  );
}
