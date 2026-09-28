import { describe, expect, it } from "vitest";
import {
  layoutSpreadMarkers,
  spreadSummary,
  type SpreadForecast,
} from "./spread-plot";

function forecast(id: string, p: number): SpreadForecast {
  return { id, label: id, p };
}

function cluster(): SpreadForecast[] {
  return [
    forecast("hedgehog", 0.4),
    forecast("drunk", 0.42),
    forecast("drift", 0.45),
    forecast("parrot", 0.52),
    forecast("cassandra", 0.58),
  ];
}

describe("layoutSpreadMarkers", () => {
  it("places a single marker at its probability in the up lane", () => {
    const markers = layoutSpreadMarkers([forecast("solo", 0.3)]);
    expect(markers).toHaveLength(1);
    expect(markers[0].left).toBe(30);
    expect(markers[0].lane).toBe("up");
    expect(markers[0].offset).toBe(0);
  });

  it("never moves a marker horizontally away from its probability", () => {
    const markers = layoutSpreadMarkers(cluster());
    for (const marker of markers) {
      expect(marker.left).toBeCloseTo(Math.round(marker.forecast.p * 100), 6);
    }
  });

  it("is deterministic for the same input", () => {
    expect(layoutSpreadMarkers(cluster())).toEqual(layoutSpreadMarkers(cluster()));
  });

  it("separates clustered markers without shrinking or dropping any", () => {
    const markers = layoutSpreadMarkers(cluster());
    expect(markers).toHaveLength(5);
    const upNoOffset = markers.filter((m) => m.lane === "up" && m.offset === 0);
    const downNoOffset = markers.filter((m) => m.lane === "down" && m.offset === 0);
    const lefts = (rows: typeof markers) => rows.map((m) => m.left);
    for (const row of [upNoOffset, downNoOffset]) {
      const sorted = [...lefts(row)].sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i += 1) {
        expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("forces a 99% forecaster into the up lane, away from the outcome label", () => {
    const markers = layoutSpreadMarkers([
      forecast("always yes", 0.99),
      forecast("doubter", 0.05),
    ], true);
    const alwaysYes = markers.find((m) => m.forecast.id === "always yes");
    expect(alwaysYes?.lane).toBe("up");
  });

  it("forces a 100% forecaster into the up lane, away from the outcome label", () => {
    const markers = layoutSpreadMarkers([forecast("certain", 1)], true);
    expect(markers[0].lane).toBe("up");
  });

  it("stacks multiple edge forecasters upward with growing offsets", () => {
    const markers = layoutSpreadMarkers([
      forecast("edge-a", 0.98),
      forecast("edge-b", 0.99),
      forecast("edge-c", 1),
    ], true);
    const ups = markers.filter((m) => m.lane === "up");
    expect(ups).toHaveLength(3);
    const offsets = ups.map((m) => m.offset);
    expect(Math.max(...offsets)).toBeGreaterThan(0);
  });

  it("handles an empty list", () => {
    expect(layoutSpreadMarkers([])).toEqual([]);
  });
});

describe("spreadSummary", () => {
  it("describes an empty spread honestly", () => {
    expect(spreadSummary([], true)).toContain("No forecasters to plot");
    expect(spreadSummary([], false)).toContain("Outcome NO");
  });

  it("lists every forecaster and the outcome", () => {
    const text = spreadSummary(cluster(), false);
    expect(text).toContain("5 forecasters");
    expect(text).toContain("cassandra said 58%");
    expect(text).toContain("Outcome NO at 100%");
  });
});
