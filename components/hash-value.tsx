"use client";

import { useState } from "react";

interface HashValueProps {
  hash: string;
  className?: string;
  textClassName?: string;
}

export function HashValue({
  hash,
  className,
  textClassName,
}: HashValueProps) {
  const [copied, setCopied] = useState(false);

  const truncated =
    hash.length > 18
      ? `${hash.slice(0, 8)}\u2026${hash.slice(-6)}`
      : hash;

  async function copy() {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <span className={className}>
      <span title={hash} className={textClassName}>
        {truncated}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy hash"}
        className="hash-copy"
      >
        {copied ? "copied" : "copy"}
      </button>
    </span>
  );
}
