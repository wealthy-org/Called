import Link from "next/link";
import type { Metadata } from "next";
import { ReceiptSlip } from "@/components/receipt-slip";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { loadHomeReceipt } from "@/app/home-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Method — Called",
  description:
    "How a question moves from Ask to Seal to Wait to Settle, and what each step does not prove.",
};

const STEPS = [
  {
    date: "Day 0 · Ask",
    title: "A question passes the gate",
    body: "A question is only accepted if it names a future resolution date, points at a readable public source, and carries a test a machine can evaluate. The id is derived from the text, date, source, and test, so reword it and it becomes a different question.",
  },
  {
    date: "Day 0 · Seal",
    title: "Forecasters commit",
    body: "Each forecaster picks a probability and writes one sentence. The browser sends only a commit: sha-256 of the payload and a salt. Until the question closes the payload stays encrypted on the server, so nobody, including the operator, can read it.",
  },
  {
    date: "Day N · Wait",
    title: "The chain grows, and nothing is edited",
    body: "Every seal appends a record whose hash covers the previous record. The table rejects updates and deletes. Once a day, and again when a question closes, the head hash is written to Robinhood Chain in a zero-value transaction.",
  },
  {
    date: "Day N+1 · Settle",
    title: "One number, one source",
    body: "The resolver reads a single number from the source fixed at Ask time. The test turns that number into YES or NO. If the source cannot be read, the question is void. No guess is ever substituted for a missing reading.",
  },
  {
    date: "After · Score",
    title: "Brier, then skill",
    body: "Each revealed probability is scored with (p - outcome)^2. Skill is measured against an always-yes forecaster on the same set. Fewer than 20 settled answers is provisional and stays out of the ranking. A failure is counted, never scored as 0.5.",
  },
];

export default async function MethodPage() {
  const receipt = await loadHomeReceipt();
  return (
    <>
      <SiteHeader />

      <main className="wrap section">
        <p className="kicker">
          Method
        </p>
        <h1 className="page-title">
          What happens between a question and a score
        </h1>
        <p className="mt-5 max-w-[620px] text-lg text-mute">
          The same four steps run for every question, for every forecaster. The
          only thing that changes is who is doing the sealing.
        </p>

        <div className="mt-16 grid gap-16 lg:grid-cols-2">
          <ol className="relative flex flex-col gap-9 border-l border-line pl-7">
            {STEPS.map((step) => (
              <li key={step.title} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[33px] mt-2 h-[9px] w-[9px] border border-seal bg-seal"
                />
                <p className="font-mono text-[12.5px] text-mute">{step.date}</p>
                <h2 className="mt-1 text-[19px] text-bone">{step.title}</h2>
                <p className="mt-1 max-w-[460px] text-[15px] text-mute">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>

          <div className="lg:sticky lg:top-24 lg:self-start">
            {receipt ? (
              <ReceiptSlip
                rows={[
                  { label: "RECEIPT", value: receipt.receiptId },
                  { label: "RECORD", value: `#${receipt.recordIndex}` },
                  { label: "RECORD HASH", value: receipt.chainHash },
                  {
                    label: "PROBABILITY",
                    value:
                      receipt.probability === null
                        ? "sealed"
                        : `${receipt.probability}%`,
                  },
                  { label: "SEALED", value: receipt.sealedAt },
                ]}
                stamp={receipt.anchorStatus}
                note="This receipt is signed with Ed25519 and can be checked offline with the public key at /.well-known/called-receipt-key."
              />
            ) : (
              <div className="panel p-6 text-mute">
                No receipt exists yet. A signed receipt appears after a forecast is sealed.
              </div>
            )}
          </div>
        </div>

        <section className="mt-20 border-t border-line pt-10">
          <h2 className="font-display text-2xl font-bold text-bone">
            What no step proves
          </h2>
          <ul className="mt-5 flex max-w-[680px] flex-col gap-3 text-mute">
            <li>
              A seal made today proves nothing until a later anchor covers it.
              Until then its status is <span className="text-bone">pending anchor</span>.
            </li>
            <li>
              Verifying a window of the ledger only proves that window is
              internally consistent. Rewriting the whole window from scratch would
              also verify. The published anchor is what closes that gap.
            </li>
            <li>
              A reading is one number from one source at one moment. It is not a
              claim about the underlying world, only about what that source said.
            </li>
          </ul>
          <p className="mt-8 text-mute">
            The limits are listed in full on the{" "}
            <Link href="/faq" className="text-bone hover:text-seal">
              FAQ
            </Link>
            .
          </p>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
