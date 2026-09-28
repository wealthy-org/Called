import { describe, expect, it } from "vitest";
import {
  ANCHOR_STATUS_ANCHORED,
  ANCHOR_STATUS_PENDING,
  ANCHOR_STATUS_SEALED,
  anchorStatusFor,
  bestAnchorFor,
  indexIsAnchored,
  latestAnchor,
  provenLabel,
  statusIsProven,
  type AnchorRecord,
} from "./anchor-status";

function anchor(recordCount: number, txHash = "0xabc"): AnchorRecord {
  return {
    headHash: "a".repeat(64),
    recordCount,
    txHash,
    blockNumber: 1000 + recordCount,
    blockTime: new Date("2026-10-01T00:00:00Z"),
  };
}

describe("indexIsAnchored", () => {
  it("is true when an anchor covers the index", () => {
    expect(indexIsAnchored(5, [anchor(10)])).toBe(true);
    expect(indexIsAnchored(9, [anchor(10)])).toBe(true);
  });

  it("is false at the boundary, because recordCount N covers 0..N-1 only", () => {
    expect(indexIsAnchored(10, [anchor(10)])).toBe(false);
  });

  it("is false when no anchor covers the index", () => {
    expect(indexIsAnchored(11, [anchor(10)])).toBe(false);
    expect(indexIsAnchored(0, [])).toBe(false);
  });
});

describe("anchorStatusFor", () => {
  it("reports anchored when a covering anchor exists", () => {
    expect(anchorStatusFor(3, [anchor(9)])).toBe(ANCHOR_STATUS_ANCHORED);
  });

  it("reports pending when the record is newer than every anchor", () => {
    expect(anchorStatusFor(20, [anchor(10)])).toBe(ANCHOR_STATUS_PENDING);
  });

  it("reports pending for a positive index with no anchors", () => {
    expect(anchorStatusFor(1, [])).toBe(ANCHOR_STATUS_PENDING);
  });

  it("reports sealed for the genesis index with no anchors", () => {
    expect(anchorStatusFor(-1, [])).toBe(ANCHOR_STATUS_SEALED);
  });
});

describe("latestAnchor", () => {
  it("returns the anchor with the highest record count", () => {
    expect(latestAnchor([anchor(5), anchor(12), anchor(9)])?.recordCount).toBe(12);
  });

  it("returns null when there are no anchors", () => {
    expect(latestAnchor([])).toBeNull();
  });
});

describe("bestAnchorFor", () => {
  it("returns the smallest anchor that still covers the index", () => {
    expect(bestAnchorFor(7, [anchor(5), anchor(13), anchor(8)])?.recordCount).toBe(
      8,
    );
  });

  it("returns null when no anchor covers the index", () => {
    expect(bestAnchorFor(20, [anchor(5), anchor(13)])).toBeNull();
  });
});

describe("proven guard", () => {
  it("only treats anchored as proven", () => {
    expect(statusIsProven(ANCHOR_STATUS_ANCHORED)).toBe(true);
    expect(statusIsProven(ANCHOR_STATUS_PENDING)).toBe(false);
    expect(statusIsProven(ANCHOR_STATUS_SEALED)).toBe(false);
  });

  it("never says proven before anchoring", () => {
    expect(provenLabel(ANCHOR_STATUS_PENDING)).toBe("not yet proven");
    expect(provenLabel(ANCHOR_STATUS_SEALED)).toBe("not yet proven");
    expect(provenLabel(ANCHOR_STATUS_ANCHORED)).toBe("proven");
  });
});
