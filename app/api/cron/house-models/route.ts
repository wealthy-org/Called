import { NextResponse } from "next/server";
import {
  HOUSE_MODEL_BY_ID,
  STRAY_TIER_ID,
} from "@/config/house-models";
import { checkHouseCatalog, unavailableTiers } from "@/lib/cassandra/catalog";
import { serverEnv, type EnvSource } from "@/lib/env";

export const dynamic = "force-dynamic";

const CATALOG_URL = "https://openrouter.ai/api/v1/models";

function cronAuthorized(request: Request, secret: string): boolean {
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/**
 * Daily house-model availability check (T-049). Reads the OpenRouter catalog
 * and reports which tiers are missing or no longer free. Unavailable tiers are
 * skipped automatically by the fallback walk; this route never edits config,
 * it only reports so an admin can be notified.
 */
export async function GET(request: Request) {
  const env = serverEnv(process.env as EnvSource);

  if (!cronAuthorized(request, env.CRON_SECRET)) {
    return NextResponse.json({ error: "cron secret required" }, { status: 401 });
  }

  let payload: unknown = null;
  let fetched = true;
  try {
    const response = await fetch(CATALOG_URL, {
      headers: env.OPENROUTER_API_KEY
        ? { authorization: `Bearer ${env.OPENROUTER_API_KEY}` }
        : undefined,
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      fetched = false;
    } else {
      payload = await response.json();
    }
  } catch {
    fetched = false;
  }

  const checks = fetched
    ? checkHouseCatalog(payload)
    : checkHouseCatalog(null);
  const unavailable = unavailableTiers(checks);

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    fetched,
    catalogUrl: CATALOG_URL,
    total: checks.length,
    available: checks.length - unavailable.length,
    unavailable,
    checks,
    primary: HOUSE_MODEL_BY_ID.get(checks[0]?.tierId ?? "")?.name ?? null,
    strayTier: STRAY_TIER_ID,
  });
}
