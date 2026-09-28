"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

export interface HeroProps {
  headHash: string | null;
  recordCount: number;
  anchorStatus: string;
}

const HEX = "0123456789abcdef";
const CELL = 26;
const HORIZON_TICK_MS = 90;
const HORIZON_TICK_SHARE = 0.012;
const POINTER_LIGHT_RADIUS = 210;

const DOT_STEP_RATIO = 1 / 20;
const DOT_RADIUS_RATIO = 0.36;
const DOT_PUSH_STRENGTH = 3.2;
const DOT_DRAG_MOMENTUM = 0.28;
const DOT_SPRING = 0.04;
const DOT_DAMPING = 0.86;
const DOT_COLOR_FULL_PX = 60;

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

function hexChar(): string {
  return HEX.charAt(Math.floor(Math.random() * HEX.length));
}

function useHorizonCanvas(reduced: boolean) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) {
      return;
    }
    const context = canvas.getContext("2d");
    if (context === null) {
      return;
    }

    const pointer = { x: -9999, y: -9999, active: false };

    interface Cell {
      x: number;
      y: number;
      size: number;
      alpha: number;
      char: string;
    }
    let cells: Cell[] = [];
    let width = 0;
    let height = 0;

    function build() {
      if (canvas === null) {
        return;
      }
      const ratio = window.devicePixelRatio || 1;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      context!.textBaseline = "middle";
      context!.textAlign = "center";

      cells = [];
      const ridge = height * 0.8;
      for (let y = CELL / 2; y < height; y += CELL) {
        for (let x = CELL / 2; x < width; x += CELL) {
          const wave = Math.sin((x / width) * Math.PI * 3) * CELL * 0.5;
          const ridgeY = ridge + wave;
          const below = y >= ridgeY;
          const depth = clamp((y - ridgeY) / (height - ridgeY || 1), 0, 1);
          const skyProbability = 0.06;
          if (!below && Math.random() > skyProbability) {
            continue;
          }
          const alpha = below ? clamp(1 - depth * 1.15, 0, 1) * 0.7 : 0.18;
          if (alpha <= 0.02) {
            continue;
          }
          cells.push({
            x,
            y,
            size: 12 + depth * 10,
            alpha,
            char: hexChar(),
          });
        }
      }
    }

    function paint() {
      context!.clearRect(0, 0, width, height);
      context!.font = "500 12px var(--font-plex-mono), monospace";
      for (const cell of cells) {
        let alpha = cell.alpha;
        if (pointer.active) {
          const dx = cell.x - pointer.x;
          const dy = cell.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < POINTER_LIGHT_RADIUS) {
            alpha = clamp(alpha + 0.6 * (1 - distance / POINTER_LIGHT_RADIUS), 0, 1);
          }
        }
        context!.font = `500 ${cell.size}px var(--font-plex-mono), monospace`;
        context!.fillStyle = `rgba(161,157,149,${alpha})`;
        context!.fillText(cell.char, cell.x, cell.y);
      }
    }

    build();

    let frame = 0;
    let tickAccumulator = 0;
    let last = performance.now();
    let running = true;

    const step = (now: number) => {
      const delta = now - last;
      last = now;
      tickAccumulator += delta;
      if (tickAccumulator >= HORIZON_TICK_MS) {
        tickAccumulator = 0;
        const changes = Math.floor(cells.length * HORIZON_TICK_SHARE);
        for (let i = 0; i < changes; i += 1) {
          const cell = cells[Math.floor(Math.random() * cells.length)];
          if (cell) {
            cell.char = hexChar();
          }
        }
      }
      paint();
      if (running) {
        frame = requestAnimationFrame(step);
      }
    };

    if (!reduced) {
      frame = requestAnimationFrame(step);
    } else {
      paint();
    }

    function onPointerMove(event: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    }
    function onPointerLeave() {
      pointer.active = false;
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", build);

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (reduced) {
          continue;
        }
        if (entry.isIntersecting && !running) {
          running = true;
          last = performance.now();
          frame = requestAnimationFrame(step);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(frame);
        }
      }
    });
    observer.observe(canvas);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", build);
    };
  }, [reduced]);

  return canvasRef;
}

interface DotParticle {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function useDotTitleCanvas(reduced: boolean, text: string) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) {
      return;
    }
    const context = canvas.getContext("2d");
    if (context === null) {
      return;
    }

    let particles: DotParticle[] = [];
    let step = 5;
    let radius = 1.8;
    let width = 0;
    let height = 0;

    function build() {
      if (canvas === null) {
        return;
      }
      const ratio = window.devicePixelRatio || 1;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);

      const fontPx = Math.min(width / (text.length * 0.62), height * 0.86);
      step = Math.max(3, 2, fontPx * DOT_STEP_RATIO);
      radius = step * DOT_RADIUS_RATIO;

      const offscreen = document.createElement("canvas");
      offscreen.width = width;
      offscreen.height = height;
      const off = offscreen.getContext("2d");
      if (off === null) {
        return;
      }
      off.fillStyle = "#fff";
      off.font = `700 ${fontPx}px var(--font-doto), sans-serif`;
      off.textAlign = "center";
      off.textBaseline = "middle";
      off.fillText(text, width / 2, height / 2);

      const data = off.getImageData(0, 0, width, height).data;
      particles = [];
      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const index = (Math.floor(y) * width + Math.floor(x)) * 4 + 3;
          if (data[index] > 128) {
            particles.push({
              homeX: x,
              homeY: y,
              x,
              y,
              vx: 0,
              vy: 0,
            });
          }
        }
      }
    }

    const pointer = { x: -9999, y: -9999, active: false, down: false, lastX: 0, lastY: 0 };

    function paint() {
      context!.clearRect(0, 0, width, height);
      for (const particle of particles) {
        const offset = Math.hypot(particle.x - particle.homeX, particle.y - particle.homeY);
        const mix = clamp(offset / DOT_COLOR_FULL_PX, 0, 1);
        const r = Math.round(236 + (255 - 236) * mix);
        const g = Math.round(233 + (90 - 233) * mix);
        const b = Math.round(228 + (54 - 228) * mix);
        context!.beginPath();
        context!.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
        context!.fillStyle = `rgb(${r},${g},${b})`;
        context!.fill();
      }
    }

    function tick() {
      const fontPx = Math.min(width / (text.length * 0.62), height * 0.86);
      const pushRadius = Math.max(60, fontPx * 0.85);
      for (const particle of particles) {
        if (pointer.active) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < pushRadius && distance > 0.001) {
            const force = (1 - distance / pushRadius) * DOT_PUSH_STRENGTH;
            particle.vx += (dx / distance) * force;
            particle.vy += (dy / distance) * force;
          }
        }
        particle.vx += (particle.homeX - particle.x) * DOT_SPRING;
        particle.vy += (particle.homeY - particle.y) * DOT_SPRING;
        particle.vx *= DOT_DAMPING;
        particle.vy *= DOT_DAMPING;
        particle.x += particle.vx;
        particle.y += particle.vy;
      }
      paint();
    }

    let frame = 0;
    let running = true;

    const loop = () => {
      tick();
      if (running) {
        frame = requestAnimationFrame(loop);
      }
    };

    function onPointerMove(event: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (pointer.down && pointer.active) {
        for (const particle of particles) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 40 && distance > 0.001) {
            particle.vx += (dx / distance) * DOT_DRAG_MOMENTUM * 8;
            particle.vy += (dy / distance) * DOT_DRAG_MOMENTUM * 8;
          }
        }
      }
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
    }
    function onPointerDown(event: PointerEvent) {
      onPointerMove(event);
      pointer.down = true;
    }
    function onPointerUp() {
      pointer.down = false;
    }
    function onPointerLeave() {
      pointer.active = false;
      pointer.down = false;
    }

    const waitForFont = Promise.race([
      document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);

    let cancelled = false;
    void waitForFont.then(() => {
      if (cancelled) {
        return;
      }
      build();
      if (reduced) {
        paint();
      } else {
        frame = requestAnimationFrame(loop);
      }
    });

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (reduced) {
          continue;
        }
        if (entry.isIntersecting && !running) {
          running = true;
          frame = requestAnimationFrame(loop);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(frame);
        }
      }
    });
    observer.observe(canvas);

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", build);

    return () => {
      cancelled = true;
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", build);
    };
  }, [reduced, text]);

  return canvasRef;
}

export function Hero({ headHash, recordCount, anchorStatus }: HeroProps) {
  const reduced = useReducedMotion();
  const horizonRef = useHorizonCanvas(reduced);
  const titleRef = useDotTitleCanvas(reduced, "Say it before it happens.");
  const [tickerPaused, setTickerPaused] = useState(false);

  const head = headHash ?? "no records yet";

  return (
    <section
      aria-labelledby="hero-title"
      className="relative flex min-h-[min(94vh,860px)] flex-col justify-center overflow-hidden border-b border-line"
    >
      <canvas
        ref={horizonRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background:radial-gradient(62%_46%_at_50%_36%,rgba(10,10,11,0.96),rgba(10,10,11,0.84)_60%,rgba(10,10,11,0)_100%)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1180px] flex-col items-center px-6 py-24 text-center">
        <h1 id="hero-title" className="sr-only">
          Say it before it happens.
        </h1>
        <canvas
          ref={titleRef}
          aria-hidden="true"
          className="h-[220px] w-full max-w-[880px] cursor-crosshair touch-pan-y"
        />
        <p className="mt-2 font-mono text-[13.5px] text-mute">
          Move or drag through the dots.
        </p>

        <p className="mt-10 max-w-[560px] text-lg text-mute">
          Forecasts sealed in public before the outcome exists, settled from a
          readable source, and provable only once anchored on-chain.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/questions"
            className="inline-flex min-h-[46px] items-center rounded-field bg-seal px-6 text-[15px] font-semibold text-void hover:bg-bone"
          >
            Seal a forecast
          </Link>
          <Link
            href="/ledger"
            className="inline-flex min-h-[46px] items-center rounded-field border border-bone px-6 text-[15px] font-semibold text-bone hover:bg-bone hover:text-void"
          >
            Verify the ledger
          </Link>
        </div>
      </div>

      <div className="relative z-10 border-t border-line bg-void">
        <div className="mx-auto flex w-full max-w-[1180px] items-center gap-4 px-6 py-3">
          <div
            aria-hidden="true"
            className="min-w-0 flex-1 overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(to right, transparent, black 48px, black calc(100% - 48px), transparent)",
            }}
          >
            <div
              className={`inline-flex whitespace-nowrap font-mono text-xs ${
                tickerPaused ? "" : "ticker-track"
              }`}
            >
              {[0, 1].map((copy) => (
                <span key={copy} className="pr-16">
                  <span className="text-mute">Session head </span>
                  <span className="text-seal">{head}</span>
                  <span className="text-mute"> / </span>
                  <span className="text-seal tabular-nums">{recordCount}</span>
                  <span className="text-mute"> records / </span>
                  <span className="text-seal">{anchorStatus}</span>
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            aria-pressed={tickerPaused}
            onClick={() => setTickerPaused((value) => !value)}
            className="min-h-11 min-w-[72px] rounded-field border border-line px-3 font-mono text-xs uppercase text-mute hover:text-bone"
          >
            {tickerPaused ? "Play" : "Pause"}
          </button>
        </div>
        <p aria-live="polite" className="sr-only">
          Session head {head}, {recordCount} records, anchor status {anchorStatus}.
        </p>
      </div>
    </section>
  );
}
