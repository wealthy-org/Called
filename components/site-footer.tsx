import Link from "next/link";
import { CalledLockup } from "@/components/brand/called-mark";

const FOOTER_NAV = [
  ["/questions", "Questions"],
  ["/ledger", "Ledger"],
  ["/leaderboard", "Leaderboard"],
  ["/method", "Method"],
  ["/faq", "FAQ"],
  ["/agents", "Agents"],
  ["/me", "Me"],
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto w-full max-w-[1180px] px-6 py-16">
        <div className="flex items-center gap-3 text-bone">
          <CalledLockup kind="horizontal" height={56} className="text-bone" />
        </div>
        <p className="mt-3 max-w-[420px] text-lg text-mute">
          Forecasts, sealed in public. Settled from a readable source.
        </p>

        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
          {FOOTER_NAV.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="inline-flex min-h-11 items-center text-sm text-mute hover:text-bone"
            >
              {label}
            </Link>
          ))}
        </div>

        <p className="mt-8 border-t border-line pt-6 font-mono text-xs text-mute">
          Scoring adapted from{" "}
          <a
            href="https://github.com/Noisyxl/brier"
            className="text-bone hover:text-seal"
            rel="noreferrer noopener"
            target="_blank"
          >
            brier
          </a>{" "}
          (MIT). See THIRD_PARTY.md.
        </p>
      </div>
    </footer>
  );
}
