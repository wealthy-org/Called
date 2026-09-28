"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ROBINHOOD_CHAIN_ID } from "@/lib/env";
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
const TITLE_LINES = ["Say it before", "it happens."] as const;

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

function readFontStack(cssVariable: string, fallback: string): string {
  if (typeof window === "undefined") {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(cssVariable)
    .trim();
  return value === "" ? fallback : value;
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
    const monoStack = readFontStack("--font-plex-mono", "monospace");

    interface Cell {
      x: number;
      y: number;
      size: number;
      alpha: number;
      charIndex: number;
    }
    let cells: Cell[] = [];
    let width = 0;
    let height = 0;

    function build() {
      if (canvas === null) {
        return;
      }
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
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
          const ridgeY = ridge +
            Math.sin(x * 0.0045) * height * 0.045 +
            Math.sin(x * 0.012) * height * 0.018;
          const distance = y - ridgeY;
          const band = height * 0.055;
          const density = distance >= 0 ? 1 : 0.035;
          if (Math.random() > density || Math.abs(distance) > band * 3) {
            continue;
          }
          const depth = clamp(distance / (height - ridgeY || 1), 0, 1);
          const alpha = clamp(0.92 * Math.exp(-Math.abs(distance) / band), 0, 0.92) *
            (distance > 0 ? 1 - depth * 0.78 : 0.7);
          if (alpha <= 0.02) {
            continue;
          }
          cells.push({
            x,
            y,
            size: 12 + clamp(distance / band, 0, 1) * 10,
            alpha,
            charIndex: Math.floor(Math.random() * HEX.length),
          });
        }
      }
    }

    function paint(now = performance.now()) {
      context!.clearRect(0, 0, width, height);
      for (const cell of cells) {
        const ridgeY = height * 0.8 +
          Math.sin(cell.x * 0.0045 + now * 0.00012) * height * 0.045 +
          Math.sin(cell.x * 0.012 - now * 0.00007) * height * 0.018;
        const distance = cell.y - ridgeY;
        const band = height * 0.055;
        let alpha = clamp(0.92 * Math.exp(-Math.abs(distance) / band), 0, 0.92) *
          (distance > 0 ? 1 - clamp(distance / (height - ridgeY || 1), 0, 1) * 0.78 : 0.7);
        if (pointer.active) {
          const dx = cell.x - pointer.x;
          const dy = cell.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < POINTER_LIGHT_RADIUS) {
            alpha = clamp(alpha + 0.6 * (1 - distance / POINTER_LIGHT_RADIUS), 0, 1);
          }
        }
        context!.font = `500 ${cell.size}px ${monoStack}, monospace`;
        const nearRidge = clamp(1 - Math.abs(distance) / (band * 3), 0, 1);
        const red = Math.round(161 + (236 - 161) * nearRidge * 0.7);
        const green = Math.round(157 + (233 - 157) * nearRidge * 0.7);
        const blue = Math.round(149 + (228 - 149) * nearRidge * 0.7);
        context!.fillStyle = `rgba(${red},${green},${blue},${alpha})`;
        context!.fillText(HEX.charAt(cell.charIndex), cell.x, cell.y);
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
            const advance = 1 + Math.floor(Math.random() * 3);
            cell.charIndex = (cell.charIndex + advance) % HEX.length;
          }
        }
      }
      paint(now);
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

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", build);

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (reduced || document.hidden) {
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
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
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

function useDotTitleCanvas(reduced: boolean, lines: readonly string[]) {
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

      let fontPx = Math.min(140, width / 8.6);
      const widestLine = Math.max(...lines.map((line) => line.length));
      if (widestLine * fontPx * 0.6 > width * 0.98) {
        fontPx = (width * 0.98) / (widestLine * 0.6);
      }
      height = Math.max(220, Math.ceil(fontPx * 2.04));
      canvas.height = Math.floor(height * ratio);
      canvas.style.height = `${height}px`;
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
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
      off.font = `600 ${fontPx}px ${readFontStack("--font-plex-mono", "monospace")}, monospace`;
      off.textAlign = "center";
      off.textBaseline = "middle";
      const lineHeight = fontPx * 1.02;
      const firstY = height / 2 - lineHeight / 2;
      lines.forEach((line, index) => {
        off.fillText(line, width / 2, firstY + index * lineHeight);
      });

      const data = off.getImageData(0, 0, width, height).data;
      particles = [];
      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const index = (Math.floor(y) * width + Math.floor(x)) * 4 + 3;
          if (data[index] > 110) {
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
      const fontPx = Math.min(140, width / 8.6);
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

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", build);

    return () => {
      cancelled = true;
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", build);
    };
  }, [lines, reduced]);

  return canvasRef;
}

export function Hero({ headHash, recordCount, anchorStatus }: HeroProps) {
  const reduced = useReducedMotion();
  const horizonRef = useHorizonCanvas(reduced);
  const titleRef = useDotTitleCanvas(reduced, TITLE_LINES);

  const head = headHash ?? "no records yet";

  return (
    <section
      aria-labelledby="hero-title"
      className="hero relative flex min-h-[min(94vh,860px)] flex-col justify-center overflow-hidden border-b border-line"
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

      <div className="wrap relative z-10 flex w-full flex-col items-center px-6 py-24 text-center">
        <h1 id="hero-title" className="sr-only">
          Say it before it happens.
        </h1>
        <canvas
          ref={titleRef}
          aria-hidden="true"
          className="title-cv w-full max-w-[880px] cursor-crosshair touch-pan-y"
        />
        <p className="drag-hint mt-2 font-mono text-[13.5px] text-mute">
          Move or drag through the dots.
        </p>

        <p className="lede mt-10 max-w-[560px] text-lg text-mute">
          Forecasts sealed in public before the outcome exists, settled from a
          readable source, and provable only once anchored on-chain.
        </p>

        <div className="cta mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="#question"
            className="inline-flex min-h-[46px] items-center rounded-field bg-seal px-6 text-[15px] font-semibold text-void hover:bg-bone"
          >
            Seal a forecast
          </Link>
          <Link
            href="#ledger"
            className="inline-flex min-h-[46px] items-center rounded-field border border-bone px-6 text-[15px] font-semibold text-bone hover:bg-bone hover:text-void"
          >
            Verify the ledger
          </Link>
        </div>
      </div>

      <div className="hero-foot relative z-10 border-t border-line bg-void">
        <div className="wrap flex w-full items-center gap-4 px-6 py-3">
          <div
            aria-hidden="true"
            className="min-w-0 flex-1 overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(to right, transparent, black 48px, black calc(100% - 48px), transparent)",
            }}
          >
             <div className="marq-track ticker-track inline-flex whitespace-nowrap font-mono text-xs">
              {[0, 1].map((copy) => (
                <span key={copy} className="pr-16">
                  <span className="text-mute">Session head </span>
                  <span className="text-seal">{head}</span>
                  <span className="text-mute"> / </span>
                  <span className="text-seal tabular-nums">{recordCount}</span>
                  <span className="text-mute"> records / </span>
                  <span className="text-seal">{anchorStatus}</span>
                  <span className="text-mute"> / CHAIN </span>
                  <span className="text-seal">
                    Robinhood Chain {ROBINHOOD_CHAIN_ID}
                  </span>
                  <span className="text-mute"> / HASH </span>
                  <span className="text-seal">SHA-256</span>
                </span>
              ))}
            </div>
          </div>
        </div>
        <p aria-live="polite" className="sr-only">
          Session head {head}, {recordCount} records, anchor status {anchorStatus}.
        </p>
      </div>
    </section>
  );
}
