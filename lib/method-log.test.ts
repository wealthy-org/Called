import { describe, expect, it } from "vitest";
import { dayLabel, methodSteps, rangeLabel } from "./method-log";

const NOW = new Date("2026-09-20T12:00:00Z");

const base = {
  opensAt: "2026-09-14T00:00:00Z",
  closesAt: "2026-10-02T00:00:00Z",
  resolvesAt: "2026-10-03T00:00:00Z",
  now: NOW,
} as const;

describe("dayLabel", () => {
  it("formats an uppercase day and month in UTC", () => {
    expect(dayLabel("2026-09-14T23:30:00Z")).toBe("14 SEP");
  });

  it("accepts a Date", () => {
    expect(dayLabel(new Date("2026-01-02T00:00:00Z"))).toBe("2 JAN");
  });

  it("degrades to a label for an unparseable input", () => {
    expect(dayLabel("not a date")).toBe("Unknown date");
  });
});

describe("rangeLabel", () => {
  it("joins two days with TO", () => {
    expect(rangeLabel("2026-10-02T00:00:00Z", "2026-10-03T00:00:00Z")).toBe(
      "2 OCT TO 3 OCT",
    );
  });
});

describe("methodSteps", () => {
  it("emits the four steps in order", () => {
    const steps = methodSteps({ ...base, status: "open", sealCount: 3 });
    expect(steps.map((step) => step.key)).toEqual([
      "ask",
      "seal",
      "wait",
      "settle",
    ]);
  });

  it("derives real date labels from the question", () => {
    const steps = methodSteps({ ...base, status: "open", sealCount: 3 });
    expect(steps[0]?.dateLabel).toBe("14 SEP");
    expect(steps[1]?.dateLabel).toBe("14 SEP");
    expect(steps[2]?.dateLabel).toBe("2 OCT TO 3 OCT");
    expect(steps[3]?.dateLabel).toBe("3 OCT");
  });

  it("marks ask done and seal done once a seal exists", () => {
    const steps = methodSteps({ ...base, status: "open", sealCount: 1 });
    expect(steps[0]?.done).toBe(true);
    expect(steps[1]?.done).toBe(true);
    expect(steps[2]?.done).toBe(false);
    expect(steps[3]?.done).toBe(false);
  });

  it("leaves seal undone with no seals", () => {
    const steps = methodSteps({ ...base, status: "open", sealCount: 0 });
    expect(steps[1]?.done).toBe(false);
    expect(steps[1]?.upcoming).toBe(false);
  });

  it("marks wait done once the close time has passed", () => {
    const steps = methodSteps({
      ...base,
      status: "closed",
      sealCount: 4,
      now: new Date("2026-10-02T06:00:00Z"),
    });
    expect(steps[2]?.done).toBe(true);
    expect(steps[2]?.upcoming).toBe(false);
    expect(steps[3]?.done).toBe(false);
  });

  it("keeps wait upcoming before the close time", () => {
    const steps = methodSteps({ ...base, status: "open", sealCount: 2 });
    expect(steps[2]?.done).toBe(false);
    expect(steps[2]?.upcoming).toBe(true);
  });

  it("marks settle done for a settled question", () => {
    const steps = methodSteps({
      ...base,
      status: "settled",
      sealCount: 5,
      now: new Date("2026-10-03T09:00:00Z"),
    });
    expect(steps[3]?.done).toBe(true);
    expect(steps[3]?.upcoming).toBe(false);
  });

  it("treats a void question as settled for grading", () => {
    const steps = methodSteps({
      ...base,
      status: "void",
      sealCount: 5,
      now: new Date("2026-10-03T09:00:00Z"),
    });
    expect(steps[3]?.done).toBe(true);
  });
});
