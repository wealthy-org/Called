import { ScrambledHash } from "./scramble";

export interface SealedReceiptData {
  sealId: string;
  commit: string;
  salt: string;
  recordIndex: number;
  receiptId: string;
}

export function ReceiptBlock({ data }: { data: SealedReceiptData }) {
  return (
    <div
      aria-live="polite"
      className="rounded-field border border-dashed border-seal p-4"
    >
      <p className="font-mono text-xs tracking-[0.06em] text-seal">SEALED</p>

      <p className="mt-3 font-mono text-sm break-all text-bone">
        <ScrambledHash hash={data.commit} className="text-seal" />
      </p>

      <dl className="mt-4 grid grid-cols-[92px_1fr] gap-x-3 gap-y-1 font-mono text-[12.5px]">
        <dt className="text-mute">INDEX</dt>
        <dd className="text-bone tabular-nums">{data.recordIndex}</dd>

        <dt className="text-mute">SEAL</dt>
        <dd className="break-all text-bone">{data.sealId}</dd>

        <dt className="text-mute">RECEIPT</dt>
        <dd className="break-all text-bone">{data.receiptId}</dd>

        <dt className="text-mute">SALT</dt>
        <dd className="break-all text-bone">{data.salt}</dd>
      </dl>

      <p className="mt-4 text-[13.5px] text-mute">
        Keep the salt. You need it to reveal this forecast after the question
        closes, and it is printed on your receipt.
      </p>
    </div>
  );
}
