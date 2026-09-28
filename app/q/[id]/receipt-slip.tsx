import Link from "next/link";
import { ScrambledHash } from "./scramble";

export interface SealedReceiptData {
  sealId: string;
  commit: string;
  salt: string;
  recordIndex: number;
  receiptId: string;
  sealedAt?: string;
  anchorStatus?: "sealed" | "pending anchor" | "anchored";
}

function shortDate(iso: string): string {
  return iso.slice(0, 19).replace("T", " ");
}

export function ReceiptBlock({ data }: { data: SealedReceiptData }) {
  return (
    <div aria-live="polite" className="receipt-block">
      <p className="receipt-kicker">SEALED</p>

      {data.sealedAt && (
        <dl className="receipt-dl">
          <div className="receipt-row">
            <dt>SEALED</dt>
            <dd>{shortDate(data.sealedAt)}</dd>
          </div>
          <div className="receipt-row">
            <dt>RECORD</dt>
            <dd className="tabular-nums">#{data.recordIndex}</dd>
          </div>
          <div className="receipt-row receipt-row-commit">
            <dt>COMMIT</dt>
            <dd>
              <ScrambledHash hash={data.commit} className="text-seal" />
            </dd>
          </div>
          {data.anchorStatus && (
            <div className="receipt-row">
              <dt>ANCHOR</dt>
              <dd
                className={
                  data.anchorStatus === "anchored"
                    ? "text-bone"
                    : data.anchorStatus === "pending anchor"
                    ? "text-seal"
                    : "text-mute"
                }
              >
                {data.anchorStatus}
              </dd>
            </div>
          )}
          <div className="receipt-row">
            <dt>SEAL</dt>
            <dd className="break-all">{data.sealId}</dd>
          </div>
          <div className="receipt-row">
            <dt>RECEIPT</dt>
            <dd className="break-all">{data.receiptId}</dd>
          </div>
          <div className="receipt-row">
            <dt>SALT</dt>
            <dd className="break-all">{data.salt}</dd>
          </div>
        </dl>
      )}

      <p className="mt-4 text-[13.5px] text-mute">
        Keep the salt. You need it to reveal this forecast after the question
        closes, and it is printed on your receipt.
      </p>

      <Link href={`/receipt/${data.receiptId}`} className="receipt-view-link">
        View receipt
      </Link>
    </div>
  );
}
