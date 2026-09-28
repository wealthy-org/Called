"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { SignInModal } from "@/components/sign-in-modal";

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
  const [signInOpen, setSignInOpen] = useState(false);
  const items = variant === "landing" ? LANDING_NAV : NAV;
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[rgba(10,10,11,0.96)]">
      <nav className="site-nav wrap flex items-center gap-1">
        <Link
          href="/"
          aria-label="Called home"
          className="mr-4 inline-flex min-h-11 items-center gap-2 text-bone"
        >
          <Image
            src="/called-mark.png"
            alt=""
            width={28}
            height={28}
            priority
            className="h-7 w-7"
          />
          <span className="site-brand">Called</span>
        </Link>
        <div className="site-links ml-auto flex min-w-0 items-center gap-1">
          {items.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="inline-flex min-h-11 shrink-0 items-center rounded-field px-3 text-sm text-mute hover:bg-ink hover:text-bone"
            >
              {label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setSignInOpen(true)}
            className="inline-flex min-h-11 shrink-0 items-center rounded-field border border-line px-3 text-sm text-mute hover:border-bone hover:text-bone"
          >
            Sign in
          </button>
        </div>
      </nav>
      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </header>
  );
}
