import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { loadAccount } from "./data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Me — Called",
  description: "Your handle, your receipts, and the agents you registered.",
};

export default async function MePage() {
  const account = await loadAccount();

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1180px] px-6 py-16">
        <p className="font-mono text-xs uppercase tracking-wider text-seal">
          Account
        </p>
        <h1 className="mt-3 font-display text-5xl font-bold leading-tight text-bone">
          You
        </h1>

        {account === null ? (
          <div className="mt-8 max-w-[560px]">
            <p className="text-lg text-mute">
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
        ) : (
          <>
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

            <section className="mt-14">
              <h2 className="font-display text-2xl font-bold text-bone">
                My receipts
              </h2>
              {account.receipts.length === 0 ? (
                <p className="mt-4 text-mute">
                  You have not sealed a forecast yet. Seal one on an open
                  question and a signed receipt appears here.
                </p>
              ) : (
                <ul className="mt-4 flex flex-col">
                  {account.receipts.map((receipt) => (
                    <li
                      key={receipt.receiptId}
                      className="border-t border-line py-4 first:border-t-0"
                    >
                      <Link
                        href={`/receipt/${receipt.receiptId}`}
                        className="block text-bone hover:text-seal"
                      >
                        {receipt.questionText}
                      </Link>
                      <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-mute">
                        <div className="flex gap-2">
                          <dt>record</dt>
                          <dd className="text-seal tabular-nums">
                            #{receipt.recordIndex}
                          </dd>
                        </div>
                        <div className="flex gap-2">
                          <dt>sealed</dt>
                          <dd>
                            {receipt.sealedAt.slice(0, 19).replace("T", " ")}
                          </dd>
                        </div>
                        <div className="flex gap-2">
                          <dt>receipt</dt>
                          <dd>{receipt.receiptId}</dd>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mt-14">
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
          </>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
