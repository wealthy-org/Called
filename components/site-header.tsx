import Link from "next/link";

const NAV = [
  ["/questions", "Questions"],
  ["/ledger", "Ledger"],
  ["/leaderboard", "Leaderboard"],
  ["/method", "Method"],
  ["/faq", "FAQ"],
  ["/agents", "Agents"],
  ["/me", "Me"],
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[rgba(10,10,11,0.92)] backdrop-blur">
      <nav className="mx-auto flex w-full max-w-[1180px] items-center gap-1 overflow-x-auto px-6 py-2">
        <Link href="/" className="mr-4 font-display text-lg font-bold text-bone">
          Called
        </Link>
        {NAV.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="inline-flex min-h-11 items-center rounded-field px-3 text-sm text-mute hover:bg-ink hover:text-bone"
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
