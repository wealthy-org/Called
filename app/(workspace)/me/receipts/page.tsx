import Link from "next/link";
import type { Metadata } from "next";
import { loadAccount } from "../data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My receipts — Called",
  description: "Every forecast you sealed.",
};

export default async function MeReceiptsPage() {
  const account = await loadAccount();

  if (account === null) {
    return (
      <div className="max-w-[560px]">
        <p className="text-lg text-mute">
          You are not signed in.
        </p>
      </div>
    );
  }

  return (
    <section>
      <h2 className="font-display text-2xl font-bold text-bone">
        My receipts
      </h2>
      {account.receipts.length === 0 ? (
        <p className="mt-4 text-mute">
          You have not sealed a forecast yet. Seal one on an open question
          and a signed receipt appears here.
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
  );
}
