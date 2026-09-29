"use client";

import { useState } from "react";

interface CopyValueProps {
  value: string;
  className?: string;
}

export function CopyValue({ value, className }: CopyValueProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <span className={className}>
      <span className="font-mono text-xs text-mute">{value}</span>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy ID"}
        className="hash-copy"
      >
        {copied ? "copied" : "copy"}
      </button>
    </span>
  );
}
