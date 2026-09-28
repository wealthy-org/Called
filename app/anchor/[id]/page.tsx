import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { explorerTxLink } from "@/lib/explorer";
import { loadAnchor } from "./data";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/anchor/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `Anchor ${id} — Called` };
}

export default async function AnchorPage(props: PageProps<"/anchor/[id]">) {
  const { id } = await props.params;
  const anchor = await loadAnchor(id);

  if (anchor === null) {
    notFound();
  }

  const txLink = explorerTxLink(anchor.txHash);

  return (
    <>
      <SiteHeader />
    <main className="wrap section">
      <p className="font-mono text-xs uppercase text-mute">Anchor</p>
      <h1 className="mt-1 font-display text-3xl text-bone">Chain head</h1>
      <p className="mt-2 max-w-xl text-sm text-mute">
        The chain head was written to Robinhood Chain as a zero-value
        transaction. No contract, no token.
      </p>

      <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs text-mute">
        <div className="flex gap-2">
          <dt className="uppercase">Records</dt>
          <dd className="text-seal tabular-nums">{anchor.recordCount}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="uppercase">Block</dt>
          <dd className="text-bone tabular-nums">{anchor.blockNumber}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="uppercase">Time</dt>
          <dd className="text-bone">{anchor.blockTime.toISOString()}</dd>
        </div>
      </dl>

      <section className="mt-8 border-t border-line pt-6">
        <h2 className="font-mono text-xs uppercase text-mute">Head hash</h2>
        <p className="mt-2 break-all font-mono text-sm text-bone">
          {anchor.headHash}
        </p>
      </section>

      <section className="mt-6 border-t border-line pt-6">
        <h2 className="font-mono text-xs uppercase text-mute">Transaction</h2>
        <p className="mt-2 break-all font-mono text-sm text-bone">
          {anchor.txHash}
        </p>
        {txLink !== null ? (
          <a
            className="mt-3 inline-flex h-11 items-center text-sm text-seal underline underline-offset-4 hover:text-bone"
            href={txLink}
            rel="noreferrer noopener"
            target="_blank"
          >
            View on explorer
          </a>
        ) : null}
      </section>

      <section className="mt-6 border-t border-line pt-6">
        <h2 className="font-mono text-xs uppercase text-mute">
          Verify by hand
        </h2>
        <ol className="mt-2 max-w-xl list-decimal space-y-1 pl-5 text-sm text-mute">
          <li>Open the transaction in the explorer.</li>
          <li>
            Copy the calldata and drop the first 10 characters (the{" "}
            <span className="font-mono">0x</span> prefix plus the 8-character
            tag).
          </li>
          <li>
            Compare the next 64 characters with the head hash above. They must
            match exactly.
          </li>
        </ol>
        <p className="mt-3 max-w-xl text-sm text-mute">
          A record is only ever called proven once an anchor covering it
          exists. Before that it stays pending anchor.
        </p>
      </section>

      <p className="mt-8 border-t border-line pt-6 font-mono text-xs text-mute">
        <Link className="underline underline-offset-4 hover:text-bone" href="/ledger">
          Back to the ledger
        </Link>
      </p>
    </main>
    <SiteFooter />
    </>
  );
}
