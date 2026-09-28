import { describe, expect, it } from "vitest";
import { findVagueWords } from "./vague";

describe("findVagueWords", () => {
  it("finds single vague words", () => {
    expect(findVagueWords("Will the price rise significantly soon?")).toEqual([
      "significantly",
      "soon",
    ]);
  });

  it("finds multi-word phrases", () => {
    expect(findVagueWords("Price moves more or less upward")).toEqual([
      "more or less",
    ]);
  });

  it("is case insensitive", () => {
    expect(findVagueWords("LIKELY higher")).toEqual(["likely"]);
  });

  it("ignores precise wording", () => {
    expect(
      findVagueWords("Will the NVDA token close at or above $210.00 on 3 Oct 2026?"),
    ).toEqual([]);
  });

  it("does not match substrings of other words", () => {
    expect(findVagueWords("Will the soonish relay improve?")).toEqual([]);
  });
});
