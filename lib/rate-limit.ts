export interface RateLimitRule {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface WindowState {
  count: number;
  startedAt: number;
}

const PRUNE_AT_SIZE = 1000;

export class FixedWindowLimiter {
  private readonly rule: RateLimitRule;
  private readonly now: () => number;
  private readonly windows = new Map<string, WindowState>();

  constructor(rule: RateLimitRule, now: () => number = Date.now) {
    if (!Number.isFinite(rule.limit) || rule.limit <= 0) {
      throw new Error("rate limit must be a positive number");
    }
    if (!Number.isFinite(rule.windowMs) || rule.windowMs <= 0) {
      throw new Error("rate limit window must be a positive number");
    }
    this.rule = rule;
    this.now = now;
  }

  check(key: string): RateLimitResult {
    const now = this.now();
    const state = this.windows.get(key);

    if (state === undefined || now - state.startedAt >= this.rule.windowMs) {
      if (this.windows.size >= PRUNE_AT_SIZE) {
        this.prune(now);
      }
      this.windows.set(key, { count: 1, startedAt: now });
      return {
        allowed: true,
        remaining: this.rule.limit - 1,
        retryAfterSeconds: 0,
      };
    }

    if (state.count >= this.rule.limit) {
      const retryAfterMs = state.startedAt + this.rule.windowMs - now;
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      };
    }

    state.count += 1;
    return {
      allowed: true,
      remaining: this.rule.limit - state.count,
      retryAfterSeconds: 0,
    };
  }

  reset(): void {
    this.windows.clear();
  }

  private prune(now: number): void {
    for (const [key, state] of this.windows) {
      if (now - state.startedAt >= this.rule.windowMs) {
        this.windows.delete(key);
      }
    }
  }
}

export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded !== null && forwarded.trim() !== "") {
    const first = forwarded.split(",")[0]?.trim();
    if (first !== undefined && first !== "") {
      return first;
    }
  }

  const real = headers.get("x-real-ip");
  if (real !== null && real.trim() !== "") {
    return real.trim();
  }

  return "unknown";
}
