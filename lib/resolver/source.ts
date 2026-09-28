export interface TwapSource {
  kind: "dex.twap";
  pool: string;
  window: string;
}

export interface OracleSource {
  kind: "oracle";
  feed: string;
}

export interface ManualSource {
  kind: "manual";
}

export type SourceSpec = TwapSource | OracleSource | ManualSource;

const WINDOW_PATTERN = /^(\d+[mhd])$/;

export function isOracleFeedAllowlisted(
  feed: string,
  allowlist: readonly string[],
): boolean {
  const target = feed.toLowerCase();
  return allowlist.some((entry) => entry.toLowerCase() === target);
}

export function parseSource(source: string): SourceSpec {
  const trimmed = source.trim();
  const separator = trimmed.indexOf(":");
  const scheme = separator === -1 ? trimmed : trimmed.slice(0, separator);

  if (scheme === "manual") {
    if (trimmed !== "manual") {
      throw new Error(`manual source takes no arguments: ${source}`);
    }
    return { kind: "manual" };
  }

  if (scheme === "dex.twap") {
    const parts = trimmed.split(":");
    if (parts.length !== 3) {
      throw new Error("dex.twap source must be dex.twap:<pool>:<window>");
    }
    const pool = parts[1];
    const window = parts[2];
    if (pool.length === 0) {
      throw new Error("dex.twap source is missing a pool");
    }
    if (!WINDOW_PATTERN.test(window)) {
      throw new Error(`dex.twap window must look like 30m, 4h or 1d: ${window}`);
    }
    return { kind: "dex.twap", pool, window };
  }

  if (scheme === "oracle") {
    const feed = trimmed.slice("oracle:".length);
    if (feed.length === 0) {
      throw new Error("oracle source must be oracle:<feed address>");
    }
    return { kind: "oracle", feed };
  }

  throw new Error(`unknown source scheme: ${scheme}`);
}
