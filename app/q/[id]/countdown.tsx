"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/countdown";

export function Countdown({ target }: { target: string }) {
  const [text, setText] = useState(() => formatCountdown(target, new Date()));

  useEffect(() => {
    const tick = () => setText(formatCountdown(target, new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <span className="font-mono text-seal tabular-nums" aria-live="off">
      {text}
    </span>
  );
}
