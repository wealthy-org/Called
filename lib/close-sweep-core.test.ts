import { describe, expect, it } from "vitest";
import { sweepDueQuestions, type CloseSweepDeps } from "./close-sweep-core";

const NOW = new Date("2026-10-01T00:00:00Z");

function deps(overrides: Partial<CloseSweepDeps> = {}): CloseSweepDeps {
  return {
    listDue: async () => [],
    close: async () => ({ ok: true, revealed: 0 }),
    ...overrides,
  };
}

describe("sweepDueQuestions", () => {
  it("returns an empty sweep when nothing is due", async () => {
    const result = await sweepDueQuestions(NOW, deps());
    expect(result).toEqual({ due: 0, closed: [], skipped: [] });
  });

  it("closes every due question and reports the reveal count", async () => {
    const close = async (id: string) =>
      id === "q-1" ? { ok: true as const, revealed: 3 } : { ok: true as const, revealed: 1 };
    const result = await sweepDueQuestions(
      NOW,
      deps({ listDue: async () => ["q-1", "q-2"], close }),
    );
    expect(result.due).toBe(2);
    expect(result.closed).toEqual([
      { questionId: "q-1", revealed: 3 },
      { questionId: "q-2", revealed: 1 },
    ]);
    expect(result.skipped).toEqual([]);
  });

  it("collects a lost race as a skip instead of throwing", async () => {
    const result = await sweepDueQuestions(
      NOW,
      deps({
        listDue: async () => ["q-1", "q-2"],
        close: async (id) =>
          id === "q-1"
            ? { ok: false as const, reason: "not_open" }
            : { ok: true as const, revealed: 2 },
      }),
    );
    expect(result.skipped).toEqual([{ questionId: "q-1", reason: "not_open" }]);
    expect(result.closed).toEqual([{ questionId: "q-2", revealed: 2 }]);
  });

  it("passes the same clock to listDue and close", async () => {
    const seen: string[] = [];
    await sweepDueQuestions(
      NOW,
      deps({
        listDue: async (at) => {
          seen.push(at.toISOString());
          return ["q-1"];
        },
        close: async (_id, at) => {
          seen.push(at.toISOString());
          return { ok: true, revealed: 0 };
        },
      }),
    );
    expect(seen).toEqual([NOW.toISOString(), NOW.toISOString()]);
  });
});
