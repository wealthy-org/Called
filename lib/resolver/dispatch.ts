import { readTwap } from "./dex-twap";
import { readOracle } from "./oracle";
import type { SourceSpec } from "./source";

export type ResolvedReading =
  | {
      ok: true;
      value: number;
      blockNumber: number;
      observedAt: string;
    }
  | { ok: false; reason: string; message: string };

export interface DispatchReaders {
  twap?: (spec: SourceSpec) => Promise<unknown>;
  oracle?: { read: (feed: string) => Promise<unknown>; allowlist: string[] };
  now?: Date;
}

/**
 * Routes a question's source spec to the right resolver. Returns a reading
 * whose shape `settle()` understands: a bool `ok`, and when ok a numeric
 * `value`, numeric `blockNumber` and string `observedAt`. Missing readers and
 * manual sources resolve as unreadable so a question voids rather than
 * guessing.
 */
export async function dispatchReading(
  spec: SourceSpec,
  readers: DispatchReaders,
): Promise<ResolvedReading> {
  const now = readers.now ?? new Date();

  if (spec.kind === "manual") {
    return {
      ok: false,
      reason: "manual_settlement",
      message: "manual settlements run through the two-admin-approval flow",
    };
  }

  if (spec.kind === "dex.twap") {
    if (!readers.twap) {
      return {
        ok: false,
        reason: "reader_unavailable",
        message: "no dex.twap resolver wired",
      };
    }
    const reading = await readTwap(spec, { twap: readers.twap });
    return reading.ok
      ? {
          ok: true,
          value: reading.value,
          blockNumber: reading.blockNumber,
          observedAt: reading.observedAt,
        }
      : { ok: false, reason: reading.reason, message: reading.message };
  }

  if (!readers.oracle) {
    return {
      ok: false,
      reason: "reader_unavailable",
      message: "no oracle resolver wired",
    };
  }

  const reading = await readOracle(
    spec,
    { read: readers.oracle.read },
    { allowlist: readers.oracle.allowlist, now },
  );
  return reading.ok
    ? {
        ok: true,
        value: reading.value,
        blockNumber: reading.blockNumber,
        observedAt: reading.observedAt,
      }
    : { ok: false, reason: reading.reason, message: reading.message };
}