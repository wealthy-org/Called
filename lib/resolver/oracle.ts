import { isOracleFeedAllowlisted, type OracleSource } from "./source";

export type UnreadableReason =
  | "source_unreachable"
  | "malformed_response"
  | "stale_reading"
  | "unverified_feed";

export type ResolverReading =
  | {
      ok: true;
      value: number;
      blockNumber: number;
      observedAt: string;
    }
  | { ok: false; reason: UnreadableReason; message: string };

export interface OraclePayload {
  value: string;
  blockNumber: number;
  observedAt: string;
  updatedAt: string;
}

export interface OracleReader {
  read(feed: string): Promise<unknown>;
}

export const MAX_READING_AGE_MS = 6 * 60 * 60 * 1000;

function parsePayload(raw: unknown): OraclePayload | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  const record = raw as Record<string, unknown>;
  if (
    typeof record.value !== "string" ||
    typeof record.blockNumber !== "number" ||
    typeof record.observedAt !== "string" ||
    typeof record.updatedAt !== "string"
  ) {
    return null;
  }
  return {
    value: record.value,
    blockNumber: record.blockNumber,
    observedAt: record.observedAt,
    updatedAt: record.updatedAt,
  };
}

export async function readOracle(
  spec: OracleSource,
  reader: OracleReader,
  options: {
    allowlist: readonly string[];
    now: Date;
  },
): Promise<ResolverReading> {
  if (!isOracleFeedAllowlisted(spec.feed, options.allowlist)) {
    return {
      ok: false,
      reason: "unverified_feed",
      message: `oracle feed is not on the verified allowlist: ${spec.feed}`,
    };
  }

  let raw: unknown;
  try {
    raw = await reader.read(spec.feed);
  } catch (error) {
    return {
      ok: false,
      reason: "source_unreachable",
      message: `oracle feed could not be read: ${describe(error)}`,
    };
  }

  const payload = parsePayload(raw);
  if (payload === null) {
    return {
      ok: false,
      reason: "malformed_response",
      message: "oracle feed returned an unreadable payload",
    };
  }

  const value = Number(payload.value);
  if (!Number.isFinite(value)) {
    return {
      ok: false,
      reason: "malformed_response",
      message: `oracle value is not a number: ${payload.value}`,
    };
  }

  const updatedAt = Date.parse(payload.updatedAt);
  if (Number.isNaN(updatedAt)) {
    return {
      ok: false,
      reason: "malformed_response",
      message: "oracle updatedAt is not a timestamp",
    };
  }
  if (options.now.getTime() - updatedAt > MAX_READING_AGE_MS) {
    return {
      ok: false,
      reason: "stale_reading",
      message: `oracle reading is older than ${MAX_READING_AGE_MS}ms`,
    };
  }

  return {
    ok: true,
    value,
    blockNumber: payload.blockNumber,
    observedAt: payload.observedAt,
  };
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
