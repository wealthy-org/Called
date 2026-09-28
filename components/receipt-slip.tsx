export interface ReceiptRow {
  label: string;
  value: string;
}

export interface ReceiptSlipProps {
  rows: ReceiptRow[];
  stamp?: string;
  note?: string;
  live?: boolean;
  className?: string;
}

export function ReceiptSlip({
  rows,
  stamp,
  note,
  live = false,
  className,
}: ReceiptSlipProps) {
  return (
    <div className={className}>
      <figure
        aria-live={live ? "polite" : undefined}
        className="relative mx-auto w-full max-w-[420px] -rotate-[1.2deg] rounded-sharp bg-paper text-paper-ink motion-reduce:rotate-0"
      >
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -bottom-2 h-2 px-7 [background:repeating-linear-gradient(to_right,var(--paper)_0,var(--paper)_8px,transparent_8px,transparent_12px)]"
        />

        <div className="px-7 pt-[30px] pb-[34px] shadow-[0_18px_40px_rgba(0,0,0,0.5)]">
          <figcaption className="font-display text-[30px] leading-none font-extrabold tracking-tight">
            RECEIPT
          </figcaption>

          <dl className="mt-6">
            {rows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[120px_1fr] gap-x-4 border-t border-dotted border-paper-rule py-1.5"
              >
                <dt className="font-mono text-[12.5px] leading-snug text-paper-label">
                  {row.label}
                </dt>
                <dd className="font-mono text-[12.5px] leading-snug break-all">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>

          {stamp ? (
            <p className="mt-6 inline-block border border-paper-ink px-2 py-1 font-mono text-xs tracking-[0.06em]">
              {stamp}
            </p>
          ) : null}
        </div>
      </figure>

      {note ? (
        <p className="mx-auto mt-5 max-w-[420px] text-[13.5px] text-mute">
          {note}
        </p>
      ) : null}
    </div>
  );
}
