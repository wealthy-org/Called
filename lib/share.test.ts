import { describe, expect, it } from "vitest";
import {
  formatShareDate,
  formatSharePercent,
  shareHeadline,
  shareProvenWord,
  shareStatement,
  shareVerificationUrl,
} from "./share";

describe("formatSharePercent", () => {
  it("rounds a probability to a whole percent", () => {
    expect(formatSharePercent(0.68)).toBe("68%");
    expect(formatSharePercent(0.681)).toBe("68%");
    expect(formatSharePercent(0.685)).toBe("69%");
  });

  it("clamps values outside 0..1", () => {
    expect(formatSharePercent(1.4)).toBe("100%");
    expect(formatSharePercent(-0.2)).toBe("0%");
    expect(formatSharePercent(Number.NaN)).toBe("0%");
  });
});

describe("formatShareDate", () => {
  it("formats a UTC date as day and short month", () => {
    expect(formatShareDate(new Date("2026-09-26T23:30:00Z"))).toBe("26 Sep");
    expect(formatShareDate(new Date("2026-01-02T00:00:00Z"))).toBe("2 Jan");
  });
});

describe("shareStatement", () => {
  it("quotes the sealed probability and date", () => {
    const statement = shareStatement({
      probability: 0.68,
      sealedAt: new Date("2026-09-26T10:00:00Z"),
    });
    expect(statement).toBe(
      "Sealed 68% on 26 Sep, before the outcome existed.",
    );
  });

  it("omits the number when none is known", () => {
    const statement = shareStatement({
      probability: null,
      sealedAt: new Date("2026-09-26T10:00:00Z"),
    });
    expect(statement).toBe(
      "Sealed a forecast on 26 Sep, before the outcome existed.",
    );
  });
});

describe("shareHeadline", () => {
  it("shows the outcome once resolved", () => {
    expect(
      shareHeadline({
        probability: 0.68,
        sealedAt: new Date("2026-09-26T10:00:00Z"),
        outcome: "YES",
      }),
    ).toBe("Sealed 68% — the outcome was YES.");
  });

  it("never claims a result for void or unsettled forecasts", () => {
    const base = {
      probability: 0.68,
      sealedAt: new Date("2026-09-26T10:00:00Z"),
    };
    expect(shareHeadline({ ...base, outcome: "VOID" })).toBe(
      "Sealed 68% on 26 Sep, before the outcome existed.",
    );
    expect(shareHeadline({ ...base, outcome: null })).toBe(
      "Sealed 68% on 26 Sep, before the outcome existed.",
    );
  });
});

describe("shareVerificationUrl", () => {
  it("builds an absolute receipt link and trims trailing slashes", () => {
    expect(shareVerificationUrl("https://called.example", "rcpt-1")).toBe(
      "https://called.example/receipt/rcpt-1",
    );
    expect(shareVerificationUrl("https://called.example/", "rcpt-1")).toBe(
      "https://called.example/receipt/rcpt-1",
    );
  });
});

describe("shareProvenWord", () => {
  it("only says proven for anchored records", () => {
    expect(shareProvenWord("anchored")).toBe("proven");
    expect(shareProvenWord("pending anchor")).toBe("not yet proven");
    expect(shareProvenWord("sealed")).toBe("not yet proven");
  });
});
