import type { ReactNode } from "react";

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    q: "What does a sealed record actually prove?",
    a: "That a prediction existed before its outcome only once the record is anchored on-chain. Before that, it is a claim this server makes. The record status says which: sealed, pending anchor, or anchored.",
  },
  {
    q: "Why is a score marked provisional?",
    a: "A skill number from a small set of questions is noise, not a ranking. Anyone with fewer than 20 settled answers is marked provisional and kept out of the ranking, even when the number looks good.",
  },
  {
    q: "Can a failed call be scored as 50%?",
    a: "No. A failure is counted as a failure. It is never turned into a number, and it never becomes a lucky or unlucky 0.5.",
  },
  {
    q: "Can I compare scores across different question sets?",
    a: "No. Skill is measured against always-yes on the same shared set of questions. There is no transferable value between two different sets, so numbers from one arena do not carry to another.",
  },
  {
    q: "A question about the past — does answering it measure forecasting?",
    a: "No. A question whose answer is already public measures memory, not foresight. Questions are gated on a future date, and the source and test are fixed before anyone seals.",
  },
  {
    q: "Does a model's result depend on its prompt and temperature?",
    a: "Yes. Cassandra runs at temperature 0 with a prompt kept in the repository and pinned to a model version. Change either and it is a new forecaster whose scores are never mixed with the old one.",
  },
  {
    q: "Who can seal a forecast?",
    a: "Anyone who signs in with a wallet. Cassandra and the baselines seal through the same path, once per question, as soon as the question opens.",
  },
  {
    q: "What happens when the source cannot be read?",
    a: "The question is void. The resolver reads one number from one source; if it cannot read a trustworthy number, it never guesses. A void question is not scored for anyone.",
  },
];

export const HOME_FAQ_ITEMS: readonly FaqItem[] = [
  {
    q: "Why can't I edit a forecast?",
    a: "Editing would let anyone claim afterwards that they called it. The point of the ledger is that the number existed before the answer did, so a sealed forecast is final.",
  },
  {
    q: "Does any money change hands?",
    a: "No. There are no stakes and no payouts. Rankings are computed from settled questions only, so there is nothing to win except a track record.",
  },
  {
    q: "What if the model gives no probability?",
    a: "It is recorded as a failure. It is not converted into a number, because turning \"fairly likely\" into 0.7 is the most common way forecasting evaluations go wrong.",
  },
  {
    q: "How is a question settled?",
    a: "By the source and test written into the question before any forecast exists. The resolver reads one number and applies the test. Nobody decides afterwards.",
  },
  {
    q: "Why show n next to every score?",
    a: "Twenty settled questions is mostly noise. The count is part of the result, so it is always printed beside the score.",
  },
];

export function FaqRow({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="group">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-[22px] text-[19px] font-medium text-bone">
        {q}
        <span aria-hidden="true" className="font-mono text-mute">
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">-</span>
        </span>
      </summary>
      <p className="max-w-[640px] pb-6 text-mute">{children}</p>
    </details>
  );
}
