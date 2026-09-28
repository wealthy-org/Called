import Link from "next/link";

const FOOTER_NAV = [
  ["/questions", "Questions"],
  ["/ledger", "Ledger"],
  ["/leaderboard", "Leaderboard"],
  ["/method", "Method"],
  ["/faq", "FAQ"],
  ["/agents", "Agents"],
  ["/me", "Me"],
  ["/third-party", "Third-party notices"],
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="wrap py-16">
        <div className="flex flex-wrap items-start justify-between gap-x-10 gap-y-4">
          <p className="site-footer-wordmark text-bone">Called</p>
          <p className="max-w-[420px] pt-2 text-lg text-mute">
            Forecasts, sealed in public. Settled from a readable source.
          </p>
        </div>

        <nav
          aria-label="Footer"
          className="mt-8 flex flex-wrap gap-x-6 gap-y-2"
        >
          {FOOTER_NAV.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="inline-flex min-h-11 items-center text-sm text-mute hover:text-bone"
            >
              {label}
            </Link>
          ))}
        </nav>

        <p className="mt-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-line pt-6 font-mono text-xs text-mute">
          <span>
            Scoring adapted from{" "}
            <a
              href="https://github.com/Noisyxl/brier"
              className="text-bone hover:text-seal"
              rel="noreferrer noopener"
              target="_blank"
            >
              brier
            </a>{" "}
            (MIT).
          </span>
          <span>
            Read the full attribution on{" "}
            <Link href="/third-party" className="text-bone hover:text-seal">
              Third-party notices
            </Link>
            .
          </span>
        </p>
      </div>
    </footer>
  );
}
