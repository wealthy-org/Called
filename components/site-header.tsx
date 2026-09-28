"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SignInModal } from "@/components/sign-in-modal";

const NAV = [
  ["/questions", "Question"],
  ["/result", "Result"],
  ["/ledger", "Ledger"],
  ["/leaderboard", "Leaderboard"],
  ["/method", "Method"],
  ["/faq", "FAQ"],
] as const;

function truncateWallet(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

interface SessionUser {
  handle: string | null;
  walletAddress: string | null;
  isAdmin: boolean;
}

export function SiteHeader() {
  const router = useRouter();
  const [signInOpen, setSignInOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const walletRef = useRef<HTMLDivElement>(null);

  const avatarText = (user?.handle ?? user?.walletAddress ?? "")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: SessionUser) => setUser(data))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (walletRef.current && !walletRef.current.contains(event.target as Node)) {
        setWalletOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    setWalletOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
  }

  return (
    <>
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
            {NAV.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="hidden sm:inline-flex min-h-11 shrink-0 items-center rounded-field px-3 text-sm text-mute hover:bg-ink hover:text-bone"
              >
                {label}
              </Link>
            ))}

            {user?.walletAddress ? (
              <div ref={walletRef} className="relative">
                <button
                  type="button"
                  onClick={() => setWalletOpen((v) => !v)}
                  aria-expanded={walletOpen}
                  aria-haspopup="menu"
                  aria-label="Account menu"
                  className="ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-seal text-void"
                  title={user.handle ?? user.walletAddress ?? "Account"}
                >
                  <span className="font-mono text-xs font-bold">
                    {avatarText}
                  </span>
                </button>

                {walletOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-1 min-w-[180px] rounded-field border border-line bg-ink py-1 shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
                  >
                    <Link
                      href="/me"
                      role="menuitem"
                      onClick={() => setWalletOpen(false)}
                      className="block px-4 py-3 text-sm text-bone hover:bg-void"
                    >
                      Account
                    </Link>
                    <Link
                      href="/receipts"
                      role="menuitem"
                      onClick={() => setWalletOpen(false)}
                      className="block px-4 py-3 text-sm text-bone hover:bg-void"
                    >
                      My receipts
                    </Link>
                    <Link
                      href="/agents"
                      role="menuitem"
                      onClick={() => setWalletOpen(false)}
                      className="block px-4 py-3 text-sm text-bone hover:bg-void"
                    >
                      My agents
                    </Link>
                    {user?.isAdmin && (
                      <Link
                        href="/admin"
                        role="menuitem"
                        onClick={() => setWalletOpen(false)}
                        className="block px-4 py-3 text-sm text-seal hover:bg-void"
                      >
                        Admin
                      </Link>
                    )}
                    <div className="my-1 border-t border-line" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      className="block w-full px-4 py-3 text-left text-sm text-mute hover:bg-void hover:text-bone"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSignInOpen(true)}
                className="ml-2 inline-flex min-h-11 shrink-0 items-center rounded-field bg-seal px-4 text-sm font-semibold text-void hover:bg-bone"
              >
                Sign in
              </button>
            )}

            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="inline-flex min-h-11 shrink-0 items-center rounded-field px-3 text-sm text-mute sm:hidden"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <rect y="3" width="20" height="2" fill="currentColor" />
                <rect y="9" width="20" height="2" fill="currentColor" />
                <rect y="15" width="20" height="2" fill="currentColor" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 flex sm:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div
            className="absolute inset-0 bg-void/80"
            onClick={() => setMobileOpen(false)}
          />
          <nav className="relative ml-auto flex h-full w-full max-w-xs flex-col border-l border-line bg-ink">
            <div className="flex items-center justify-between border-b border-line px-4">
              <span className="text-sm text-mute">Menu</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="flex h-11 w-11 items-center justify-center text-mute hover:text-bone"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M1 1l16 16M17 1L1 17" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col overflow-y-auto p-4">
              {NAV.map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="block min-h-11 border-b border-line py-3 text-sm text-bone hover:text-seal"
                >
                  {label}
                </Link>
              ))}
              {user?.walletAddress && (
                <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
                  <p className="font-mono text-xs text-mute">
                    {user.handle ?? truncateWallet(user.walletAddress)}
                  </p>
                  <Link
                    href="/me"
                    onClick={() => setMobileOpen(false)}
                    className="block min-h-11 border border-line py-3 text-center text-sm text-bone hover:border-bone"
                  >
                    Account
                  </Link>
                  <Link
                    href="/receipts"
                    onClick={() => setMobileOpen(false)}
                    className="block min-h-11 border border-line py-3 text-center text-sm text-bone hover:border-bone"
                  >
                    My receipts
                  </Link>
                  <Link
                    href="/agents"
                    onClick={() => setMobileOpen(false)}
                    className="block min-h-11 border border-line py-3 text-center text-sm text-bone hover:border-bone"
                  >
                    My agents
                  </Link>
                  {user?.isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="block min-h-11 border border-seal py-3 text-center text-sm text-seal hover:border-bone"
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => { setMobileOpen(false); handleSignOut(); }}
                    className="block min-h-11 border border-line py-3 text-center text-sm text-mute hover:border-bone hover:text-bone"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}

      <SignInModal
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
        onSignedIn={() => {
          setSignInOpen(false);
          fetch("/api/auth/session", { cache: "no-store" })
            .then((r) => r.json())
            .then((data: SessionUser) => setUser(data))
            .catch(() => setUser(null));
        }}
      />
    </>
  );
}
