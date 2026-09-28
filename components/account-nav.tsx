"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AccountNavProps {
  isAdmin: boolean;
}

const NAV_ITEMS = [
  { href: "/me", label: "Overview" },
  { href: "/me/receipts", label: "Receipts" },
  { href: "/me/agents", label: "Agents" },
] as const;

export function AccountNav({ isAdmin }: AccountNavProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/me") return pathname === "/me";
    if (href === "/me/agents") return pathname.startsWith("/me/agents") || pathname === "/agents";
    return pathname.startsWith(href);
  }

  const allItems = isAdmin
    ? [...NAV_ITEMS, { href: "/admin", label: "Admin" } as const]
    : [...NAV_ITEMS];

  return (
    <>
      {/* Desktop rail */}
      <nav
        aria-label="Account navigation"
        className="hidden w-[220px] shrink-0 flex-col gap-1 lg:flex"
      >
        {allItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex items-center gap-3 min-h-[44px] px-3 text-sm rounded-field",
              isActive(item.href)
                ? "border-l-2 border-seal bg-ink pl-[10px] text-bone"
                : "text-mute hover:text-bone hover:bg-ink",
            ].join(" ")}
          >
            <span className="font-mono text-xs uppercase tracking-wider">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Mobile tab bar */}
      <nav
        aria-label="Account navigation"
        className="flex w-full flex-row gap-1 overflow-x-auto lg:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {allItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex items-center min-h-[44px] shrink-0 px-4 py-2 text-sm whitespace-nowrap rounded-field",
              isActive(item.href)
                ? "border-b-2 border-seal text-bone"
                : "text-mute hover:text-bone",
            ].join(" ")}
          >
            <span className="font-mono text-xs uppercase tracking-wider">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
