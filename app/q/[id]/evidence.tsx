import { HashValue } from "@/components/hash-value";
import { receiptPublicKey } from "@/lib/receipt";
import { serverEnv, type EnvSource } from "@/lib/env";

interface EvidenceProps {
  questionId: string;
  recordHash: string;
  headHash: string | null;
  anchorStatus: "sealed" | "pending anchor" | "anchored";
}

export async function EvidenceSection({
  questionId,
  recordHash,
  headHash,
  anchorStatus,
}: EvidenceProps) {
  let publicKey = "";
  try {
    const env = serverEnv(process.env as EnvSource);
    publicKey = await receiptPublicKey(env.RECEIPT_SIGNING_KEY);
  } catch {
    publicKey = "(unavailable)";
  }

  const rows: { label: string; desc: string; value?: React.ReactNode }[] = [
    {
      label: "COMMIT",
      desc: "Hash of the encrypted forecast and salt. Recorded at seal.",
      value: <HashValue hash={recordHash} textClassName="font-mono text-sm text-bone" />,
    },
    {
      label: "RECORD",
      desc: "Each record is linked to the previous by hash. The chain rejects edits.",
      value: headHash ? (
        <HashValue hash={headHash} textClassName="font-mono text-sm text-bone" />
      ) : (
        <span className="font-mono text-sm text-mute">—</span>
      ),
    },
    {
      label: "ANCHOR",
      desc:
        anchorStatus === "anchored"
          ? "Head hash written to Robinhood Chain. The record is anchored."
          : anchorStatus === "pending anchor"
          ? "Awaiting next daily anchor. The record is pending."
          : "No anchor yet. The record is sealed.",
      value: (
        <span
          className={`font-mono text-sm ${
            anchorStatus === "anchored"
              ? "text-bone"
              : anchorStatus === "pending anchor"
              ? "text-seal"
              : "text-mute"
          }`}
        >
          {anchorStatus}
        </span>
      ),
    },
    {
      label: "SIGNATURE",
      desc:
        "Each receipt is signed with Called's Ed25519 publication key. The public key is at /.well-known/called-receipt-key.",
      value: (
        <HashValue
          hash={publicKey}
          textClassName="font-mono text-xs text-mute"
        />
      ),
    },
    {
      label: "RECEIPT",
      desc:
        "A signed receipt is issued at seal. It is verifiable offline with the public key above.",
      value: (
        <span className="font-mono text-sm text-mute">
          /receipt/{questionId}
        </span>
      ),
    },
  ];

  return (
    <section className="evidence-section">
      <h2 className="kicker">Evidence</h2>
      <dl className="evidence-list">
        {rows.map((row) => (
          <div key={row.label} className="evidence-row">
            <dt className="evidence-label">{row.label}</dt>
            <dd className="evidence-desc">{row.desc}</dd>
            <dd className="evidence-value">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
