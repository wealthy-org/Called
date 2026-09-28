export type AnchorStatus = "sealed" | "pending anchor" | "anchored";

export interface AnchorRecord {
  headHash: string;
  recordCount: number;
  txHash: string;
  blockNumber: number;
  blockTime: Date;
}

export const ANCHOR_STATUS_SEALED: AnchorStatus = "sealed";
export const ANCHOR_STATUS_PENDING: AnchorStatus = "pending anchor";
export const ANCHOR_STATUS_ANCHORED: AnchorStatus = "anchored";

/**
 * `recordCount` is the NUMBER of records an anchor covers, so an anchor with
 * `recordCount = N` covers indices `0 .. N-1`. A record is covered only when
 * `recordCount > recordIndex`. Using `>=` would call the head record proven
 * before the covering anchor exists.
 */
export function indexIsAnchored(
  recordIndex: number,
  anchors: readonly AnchorRecord[],
): boolean {
  return anchors.some((anchor) => anchor.recordCount > recordIndex);
}

export function anchorStatusFor(
  recordIndex: number,
  anchors: readonly AnchorRecord[],
): AnchorStatus {
  if (indexIsAnchored(recordIndex, anchors)) {
    return ANCHOR_STATUS_ANCHORED;
  }
  if (recordIndex < 0) {
    return ANCHOR_STATUS_SEALED;
  }
  return ANCHOR_STATUS_PENDING;
}

export function latestAnchor(
  anchors: readonly AnchorRecord[],
): AnchorRecord | null {
  let latest: AnchorRecord | null = null;
  for (const anchor of anchors) {
    if (latest === null || anchor.recordCount > latest.recordCount) {
      latest = anchor;
    }
  }
  return latest;
}

export function bestAnchorFor(
  recordIndex: number,
  anchors: readonly AnchorRecord[],
): AnchorRecord | null {
  let best: AnchorRecord | null = null;
  for (const anchor of anchors) {
    if (anchor.recordCount <= recordIndex) {
      continue;
    }
    if (best === null || anchor.recordCount < best.recordCount) {
      best = anchor;
    }
  }
  return best;
}

export function statusIsProven(status: AnchorStatus): boolean {
  return status === ANCHOR_STATUS_ANCHORED;
}

export function provenLabel(status: AnchorStatus): string {
  return statusIsProven(status) ? "proven" : "not yet proven";
}
