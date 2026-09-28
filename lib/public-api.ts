import "server-only";
import { NextResponse } from "next/server";
import { FixedWindowLimiter, clientKey } from "./rate-limit";

const limiter = new FixedWindowLimiter({ limit: 120, windowMs: 60_000 });

export interface PublicApiOptions {
  maxAgeSeconds?: number;
}

export function rateLimited(request: Request): NextResponse | null {
  const result = limiter.check(clientKey(request.headers));
  if (result.allowed) {
    return null;
  }

  return NextResponse.json(
    { error: "rate limit exceeded" },
    {
      status: 429,
      headers: {
        "retry-after": String(result.retryAfterSeconds),
        "cache-control": "no-store",
      },
    },
  );
}

export function publicJson(
  body: unknown,
  options: PublicApiOptions = {},
): NextResponse {
  const maxAge = options.maxAgeSeconds ?? 60;
  return NextResponse.json(body, {
    headers: {
      "cache-control": `public, max-age=${maxAge}`,
      "access-control-allow-origin": "*",
    },
  });
}
