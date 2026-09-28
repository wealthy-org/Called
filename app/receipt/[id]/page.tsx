import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReceiptSlip, type ReceiptRow } from "@/components/receipt-slip";
import { explorerTxLink, loadReceiptPage } from "./data";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export async function generateMetadata({
  params,
}: PageProps<"/receipt/[id]">): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Receipt — Called",
    description: "A signed, offline-verifiable record of one sealed forecast.",
    openGraph: {
      title: "Receipt — Called",
      description: "A forecast sealed before the outcome existed.",
      images: [{ url: `/api/og/${id}`, width: 1200, height: 630 }],
    },
  };
}

export default async function ReceiptPage({
  params,
}: PageProps<"/receipt/[id]">) {
  const { id } = await params;
  const data = await loadReceiptPage(id);

  if (data === null) {
    notFound();
  }

  const rows: ReceiptRow[] = [
    { label: "RECEIPT", value: data.receiptId },
    { label: "QUESTION", value: data.questionId },
    { label: "FORECASTER", value: data.forecasterId },
    { label: "INDEX", value: String(data.recordIndex) },
    { label: "COMMIT", value: data.commit },
    { label: "RECORD HASH", value: data.recordHash },
    { label: "SALT", value: data.salt },
    { label: "SEALED", value: data.sealedAt },
    { label: "SIGNATURE", value: data.signature },
    { label: "PUBLIC KEY", value: data.publicKey },
  ];

  const txLink = explorerTxLink(data.anchorTx);

  return (
    <>
      <SiteHeader />
    <main className="wrap section">
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-mute">
        receipt
      </p>

      <div className="mt-4">
        <ReceiptSlip
          rows={rows}
          stamp={data.valid ? "VALID" : "BROKEN"}
          note="Signed with Ed25519. Verify it offline with the public key from /.well-known/called-receipt-key — no server, no account, no network required."
        />
      </div>

      <section className="mt-10 border-t border-line pt-6">
        <h2 className="font-mono text-xs uppercase tracking-[0.12em] text-mute">
          signature
        </h2>
        <p className="mt-2 text-sm text-bone" role="status">
          {data.valid
            ? "Signature checks out against the published public key."
            : "Signature does not match the published public key."}
        </p>
      </section>

      <section className="mt-8 border-t border-line pt-6">
        <h2 className="font-mono text-xs uppercase tracking-[0.12em] text-mute">
          anchor
        </h2>
        {data.anchorBlock === null ? (
          <p className="mt-2 text-sm text-mute">
            Not anchored yet. A sealed record is not anchored until a later one
            is.
          </p>
        ) : (
          <p className="mt-2 text-sm text-bone">
            Published in block{" "}
            <span className="font-mono tabular-nums">{data.anchorBlock}</span>
            {txLink === null ? null : (
              <>
                {" · "}
                <a
                  href={txLink}
                  rel="noreferrer noopener"
                  className="underline decoration-line underline-offset-4 hover:decoration-seal"
                >
                  view transaction
                </a>
              </>
            )}
          </p>
        )}
      </section>

      <section className="mt-8 border-t border-line pt-6">
        <h2 className="font-mono text-xs uppercase tracking-[0.12em] text-mute">
          result
        </h2>
        {data.outcome === null ? (
          <p className="mt-2 text-sm text-mute">
            Not resolved yet. The question is still open.
          </p>
        ) : (
          <p className="mt-2 flex items-baseline gap-3">
            <span
              className={`font-display text-5xl font-extrabold ${
                data.outcome === "VOID" ? "text-mute" : "text-bone"
              }`}
            >
              {data.outcome}
            </span>
            {data.readingValue === null ? null : (
              <span className="font-mono text-sm text-mute tabular-nums">
                reading {data.readingValue}
              </span>
            )}
          </p>
        )}
      </section>

      <footer className="mt-10 border-t border-line pt-6">
        <Link
          href={`/q/${data.questionId}`}
          className="font-mono text-xs text-mute underline decoration-line underline-offset-4 hover:decoration-seal"
        >
          back to question
        </Link>
      </footer>
    </main>
    <SiteFooter />
    </>
  );
}
