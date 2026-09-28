import { describe, expect, it } from "vitest";
import { formatCountdown, milestoneFor, partsUntil } from "./countdown";

const now = new Date("2026-10-01T12:00:00Z");

describe("partsUntil", () => {
  it("splits the remaining time into days, hours, minutes, seconds", () => {
    const parts = partsUntil("2026-10-03T14:30:45Z", now);
    expect(parts.days).toBe(2);
    expect(parts.hours).toBe(2);
    expect(parts.minutes).toBe(30);
    expect(parts.seconds).toBe(45);
    expect(parts.elapsed).toBe(false);
  });

  it("clamps to zero once the target has passed", () => {
    const parts = partsUntil("2026-09-30T00:00:00Z", now);
    expect(parts.totalMs).toBeLessThan(0);
    expect(parts.elapsed).toBe(true);
    expect(parts.days).toBe(0);
    expect(parts.seconds).toBe(0);
  });

  it("treats the exact target instant as elapsed", () => {
    expect(partsUntil(now.toISOString(), now).elapsed).toBe(true);
  });
});

describe("formatCountdown", () => {
  it("pads hours and minutes", () => {
    expect(formatCountdown("2026-10-01T12:05:09Z", now)).toBe("00:05:09");
  });

  it("includes days when present", () => {
    expect(formatCountdown("2026-10-03T14:00:00Z", now)).toBe("2d 02:00:00");
  });

  it("reports due instead of a negative time", () => {
    expect(formatCountdown("2026-09-01T00:00:00Z", now)).toBe("due");
  });
});

describe("milestoneFor", () => {
  it("counts down to close while the question is open and not yet due", () => {
    expect(
      milestoneFor("open", "2026-10-02T00:00:00Z", "2026-10-05T00:00:00Z", now),
    ).toEqual({ label: "close", at: "2026-10-02T00:00:00Z", reached: false });
  });

  it("switches to resolve once the close time has passed", () => {
    expect(
      milestoneFor("open", "2026-09-30T00:00:00Z", "2026-10-05T00:00:00Z", now),
    ).toEqual({ label: "resolve", at: "2026-10-05T00:00:00Z", reached: false });
  });

  it("switches to resolve when the status is closed", () => {
    expect(
      milestoneFor("closed", "2026-10-02T00:00:00Z", "2026-10-05T00:00:00Z", now),
    ).toEqual({ label: "resolve", at: "2026-10-05T00:00:00Z", reached: false });
  });

  it("marks resolve as reached for settled and void", () => {
    for (const status of ["settled", "void"] as const) {
      expect(
        milestoneFor(status, "2026-10-02T00:00:00Z", "2026-10-05T00:00:00Z", now),
      ).toEqual({ label: "resolve", at: "2026-10-05T00:00:00Z", reached: true });
    }
  });
});
