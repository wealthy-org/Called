import type { TwapSource } from "./source";

export type TwapUnreadableReason =
  | "source_unreachable"
  | "malformed_response"
  | "below_liquidity_threshold"
  | "no_trades_in_window";

export type TwapReading =
  | {
      ok: true;
      value: number;
      blockNumber: number;
      observedAt: string;
      pool: string;
      window: string;
    }
  | { ok: false; reason: TwapUnreadableReason; message: string };

export interface TwapPoolObservation {
  pool: string;
  price: string;
  volumeUsd: number;
  blockNumber: number;
  observedAt: string;
  trades: number;
}

export interface TwapReader {
  twap(spec: TwapSource): Promise<unknown>;
}

export const MIN_POOL_VOLUME_USD = 25_000;

function parseObservation(raw: unknown): TwapPoolObservation | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  const record = raw as Record<string, unknown>;
  if (
    typeof record.pool !== "string" ||
    typeof record.price !== "string" ||
    typeof record.volumeUsd !== "number" ||
    typeof record.blockNumber !== "number" ||
    typeof record.observedAt !== "string" ||
    typeof record.trades !== "number"
  ) {
    return null;
  }
  return {
    pool: record.pool,
    price: record.price,
    volumeUsd: record.volumeUsd,
    blockNumber: record.blockNumber,
    observedAt: record.observedAt,
    trades: record.trades,
  };
}

export async function readTwap(
  spec: TwapSource,
  reader: TwapReader,
): Promise<TwapReading> {
  let raw: unknown;
  try {
    raw = await reader.twap(spec);
  } catch (error) {
    return {
      ok: false,
      reason: "source_unreachable",
      message: `dex.twap could not be read: ${describe(error)}`,
    };
  }

  const observation = parseObservation(raw);
  if (observation === null) {
    return {
      ok: false,
      reason: "malformed_response",
      message: "dex.twap returned an unreadable observation",
    };
  }

  if (observation.pool !== spec.pool) {
    return {
      ok: false,
      reason: "malformed_response",
      message: `dex.twap answered for ${observation.pool}, expected ${spec.pool}`,
    };
  }

  const price = Number(observation.price);
  if (!Number.isFinite(price)) {
    return {
      ok: false,
      reason: "malformed_response",
      message: `dex.twap price is not a number: ${observation.price}`,
    };
  }

  if (observation.volumeUsd < MIN_POOL_VOLUME_USD) {
    return {
      ok: false,
      reason: "below_liquidity_threshold",
      message: `pool volume ${observation.volumeUsd} is below ${MIN_POOL_VOLUME_USD}`,
    };
  }

  if (observation.trades === 0) {
    return {
      ok: false,
      reason: "no_trades_in_window",
      message: `pool ${spec.pool} had no trades in ${spec.window}`,
    };
  }

  return {
    ok: true,
    value: price,
    blockNumber: observation.blockNumber,
    observedAt: observation.observedAt,
    pool: spec.pool,
    window: spec.window,
  };
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
