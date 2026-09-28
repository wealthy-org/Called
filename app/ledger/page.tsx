import Link from "next/link";
import { loadLedgerPage } from "./data";
import { HashValue } from "@/components/hash-value";
import { LedgerVerification } from "./verify";
import { explorerTxLink } from "@/lib/explorer";
import { WorkspaceFooter } from "@/components/workspace-footer";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ledger — Called",
  description:
    "The append-only chain of sealed forecasts. Every record links to the one before it.",
};

export default async function LedgerPage() {
  const data = await loadLedgerPage();

  const fromIndex =
    data.recent.length > 0 ? data.recent[0]!.index : 0;

  const explorerHref =
    data.latestAnchor !== null
      ? explorerTxLink(data.latestAnchor.txHash)
      : null;

  return (
    <>
      <SiteHeader />
      <main className="wrap section ledger-page">
        {/* Two-column page header */}
        <div className="lhead">
          {/* Left: identity + copy */}
          <div className="lhead-left">
            <p className="kicker">Append-only</p>
            <h1 className="lpage-title">Ledger</h1>
            <p className="lhead-desc">
              Every sealed forecast, in the order it was sealed. Each record
              carries the hash of the record before it, so a removed or edited
              record breaks every link after it.
            </p>
          </div>

          {/* Right: chain status index */}
          <div className="lstatus">
            <div className="lstatus-row">
              <span className="lstatus-label">HEAD</span>
              {data.headHash !== null ? (
                <HashValue
                  hash={data.headHash}
                  className="lstatus-hash"
                  textClassName="font-mono text-xs text-bone"
                />
              ) : (
                <span className="lstatus-value text-mute">—</span>
              )}
            </div>

            <div className="lstatus-row">
              <span className="lstatus-label">RECORDS</span>
              <span className="lstatus-value font-display">
                {data.total}
              </span>
            </div>

            <div className="lstatus-row">
              <span className="lstatus-label">ANCHOR</span>
              <span
                className={`lstatus-value ${
                  data.anchorStatus === "anchored"
                    ? "text-bone"
                    : data.anchorStatus === "pending anchor"
                      ? "text-seal"
                      : "text-mute"
                }`}
              >
                {data.anchorStatus === "anchored"
                  ? "ANCHORED"
                  : data.anchorStatus === "pending anchor"
                    ? "PENDING ANCHOR"
                    : "SEALED"}
              </span>
            </div>

            <div className="lstatus-row">
              <span className="lstatus-label">CHAIN</span>
              <span className="lstatus-value text-bone">Robinhood Chain</span>
            </div>

            {data.latestAnchor !== null && (
              <>
                <div className="lstatus-row">
                  <span className="lstatus-label">LATEST ANCHOR</span>
                  <span className="lstatus-value text-bone">
                    block{" "}
                    {data.latestAnchor.blockNumber.toLocaleString()}
                  </span>
                </div>
                <div className="lstatus-row">
                  <span className="lstatus-label">ANCHOR TX</span>
                  <span className="lstatus-value">
                    {explorerHref !== null ? (
                      <a
                        href={explorerHref}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-bone hover:text-seal underline underline-offset-4"
                      >
                        {data.latestAnchor.txHash.slice(0, 12)}...
                      </a>
                    ) : (
                      <span className="text-mute">
                        {data.latestAnchor.txHash.slice(0, 12)}...
                      </span>
                    )}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Verification terminal */}
        <LedgerVerification
          initialAnchorStatus={data.anchorStatus}
          initialLatestAnchor={data.latestAnchor}
        />

        {/* Recent records */}
        <section className="lrecords">
          <div className="lrecords-head">
            <h2 className="lrecords-title">Recent records</h2>
            <span className="lrecords-meta font-mono text-xs text-mute">
              {data.total === 0
                ? "no records yet"
                : `showing ${data.recent.length} most recent of ${data.total}${
                    fromIndex > 0 ? `, from index ${fromIndex}` : ""
                  }`}
            </span>
          </div>

          {data.recent.length === 0 ? (
            <p className="lrecords-empty text-mute">
              Nothing has been sealed yet. The first seal starts the chain.
            </p>
          ) : (
            <ol className="lrecord-list">
              {data.recent.map((record) => (
                <li key={record.index} className="lrecord">
                  <span className="lrecord-index font-display">
                    {record.index}
                  </span>
                  <div className="lrecord-body">
                    <div className="lrecord-row">
                      <Link
                        href={`/q/${record.questionId}`}
                        className="lrecord-question font-mono text-sm text-bone hover:text-seal underline underline-offset-4"
                      >
                        {record.questionId}
                      </Link>
                    </div>
                    <div className="lrecord-row lrecord-hash-row">
                      <HashValue
                        hash={record.hash}
                        className="lrecord-hash"
                        textClassName="font-mono text-xs text-mute"
                      />
                    </div>
                    <div className="lrecord-row">
                      <span className="lrecord-meta font-mono text-xs text-mute">
                        {record.forecasterId} ·{" "}
                        {new Date(record.sealedAt).toISOString()}
                      </span>
                      <span
                        className={`lrecord-anchor font-mono text-xs ${
                          record.anchorStatus === "anchored"
                            ? "text-bone"
                            : record.anchorStatus === "pending anchor"
                              ? "text-seal"
                              : "text-mute"
                        }`}
                      >
                        {record.anchorStatus === "anchored"
                          ? "anchored"
                          : record.anchorStatus === "pending anchor"
                            ? "pending anchor"
                            : "sealed"}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Chain explanation */}
        <section className="lnote">
          <p className="lnote-text">
            Each record references the previous record. Changing one record breaks
            the chain from that point onward. Verifying a window only proves that
            the window is internally consistent. To prove a head was not rewritten
            after the fact, compare it against a published anchor.
          </p>
        </section>
      </main>

      <WorkspaceFooter />
    </>
  );
}
