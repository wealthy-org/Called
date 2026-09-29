"use client";

import { useSyncExternalStore } from "react";

interface LiveCountdownProps {
  targetDate: string;
}

let nowMs: number | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (timer === null) {
    nowMs = Date.now();
    timer = setInterval(() => {
      nowMs = Date.now();
      listeners.forEach((fn) => fn());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
      nowMs = null;
    }
  };
}

function getSnapshot(): number | null {
  return nowMs;
}

function getServerSnapshot(): number | null {
  return null;
}

export function LiveCountdown({ targetDate }: LiveCountdownProps) {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (now === null) {
    // Initial server render (hydration safety)
    return <span suppressHydrationWarning>{formatCountdown(targetDate, new Date())}</span>;
  }

  return <span>{formatCountdown(targetDate, new Date(now))}</span>;
}

function formatCountdown(target: string, now: Date): string {
  const totalMs = new Date(target).getTime() - now.getTime();
  if (totalMs <= 0) return "due";
  const days = Math.floor(totalMs / 86_400_000);
  const hours = Math.floor((totalMs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMs % 60_000) / 1_000);
  const pad = (v: number) => String(v).padStart(2, "0");
  if (days > 0) return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
