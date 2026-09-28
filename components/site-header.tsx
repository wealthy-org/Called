import Link from "next/link";
import { CalledLockup } from "@/components/brand/called-mark";

const NAV = [
  ["/questions", "Questions"],
  ["/ledger", "Ledger"],
  ["/leaderboard", "Leaderboard"],
  ["/method", "Method"],
  ["/faq", "FAQ"],
  ["/agents", "Agents"],
  ["/me", "Me"],
] as const;

const LANDING_NAV = [
  ["#question", "Question"],
  ["#result", "Result"],
  ["#ledger", "Ledger"],
  ["#leaderboard", "Leaderboard"],
  ["#method", "Method"],
  ["#faq", "Questions asked"],
] as const;

export function SiteHeader({ variant = "app" }: { variant?: "app" | "landing" }) {
  const items = variant === "landing" ? LANDING_NAV : NAV;
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[rgba(10,10,11,0.92)] backdrop-blur">
      <nav className="mx-auto flex w-full max-w-[1180px] items-center gap-1 overflow-x-auto px-6 py-2">
        <Link
          href="/"
          aria-label="Called home"
          className="mr-4 inline-flex min-h-11 items-center text-bone hover:text-seal"
        >
          <CalledLockup kind="compact" height={30} />
        </Link>
        {items.map(([href, label]) => (
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
