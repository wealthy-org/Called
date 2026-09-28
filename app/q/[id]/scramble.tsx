"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

export const SCRAMBLE_DURATION_MS = 700;

const HEX = "0123456789abcdef";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function readReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function readReducedMotionOnServer(): boolean {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    readReducedMotion,
    readReducedMotionOnServer,
  );
}

function frameCharacter(
  target: string,
  index: number,
  progress: number,
  random: () => number,
): string {
  if (index < Math.floor(progress * target.length)) {
    return target.charAt(index);
  }
  return HEX.charAt(Math.floor(random() * HEX.length));
}

export function scrambleFrame(
  target: string,
  progress: number,
  random: () => number = Math.random,
): string {
  const clamped = Math.min(1, Math.max(0, progress));
  let out = "";
  for (let i = 0; i < target.length; i += 1) {
    out += frameCharacter(target, i, clamped, random);
  }
  return out;
}

interface Animation {
  hash: string;
  text: string;
}

export function ScrambledHash({
  hash,
  durationMs = SCRAMBLE_DURATION_MS,
  className,
}: {
  hash: string;
  durationMs?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [animation, setAnimation] = useState<Animation | null>(null);

  useEffect(() => {
    if (reduced || hash.length === 0) {
      return;
    }

    const start = performance.now();
    let handle = 0;

    const tick = (now: number) => {
      const progress = (now - start) / durationMs;
      if (progress >= 1) {
        setAnimation({ hash, text: hash });
        return;
      }
      setAnimation({ hash, text: scrambleFrame(hash, progress) });
      handle = requestAnimationFrame(tick);
    };

    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [hash, durationMs, reduced]);

  const settled = reduced || hash.length === 0;
  const running = animation !== null && animation.hash === hash;
  const visible = settled ? hash : running ? animation.text : "";

  return (
    <span className={className}>
      <span aria-hidden="true">{visible}</span>
      <span className="sr-only">{hash}</span>
    </span>
  );
}
