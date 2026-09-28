import { describe, expect, it } from "vitest";
import {
  isAdmin,
  MissingEnvError,
  parseAdminWallets,
  ROBINHOOD_CHAIN_ID,
  serverEnv,
  type EnvSource,
} from "./env";

const complete = {
  DATABASE_URL: "postgres://user:pass@localhost:5432/called",
  RECEIPT_SIGNING_KEY: "ed25519-secret",
  SESSION_SECRET: "session-secret",
  ADMIN_WALLETS: "0xAAA,0xbbb",
  CRON_SECRET: "cron-secret",
  HOUSE_TEMPERATURE: "0",
} satisfies EnvSource;

describe("serverEnv", () => {
  it("parses a complete environment", () => {
    const env = serverEnv(complete);
    expect(env.DATABASE_URL).toBe(complete.DATABASE_URL);
    expect(env.ADMIN_WALLETS).toEqual(["0xaaa", "0xbbb"]);
    expect(env.HOUSE_TEMPERATURE).toBe(0);
  });

  it("names every missing variable at once", () => {
    let error: unknown;
    try {
      serverEnv({});
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(MissingEnvError);
    const missing = (error as MissingEnvError).variables;
    expect(missing).toContain("DATABASE_URL");
    expect(missing).toContain("CRON_SECRET");
    expect(missing).toHaveLength(5);
  });

  it("treats blank values as missing", () => {
    expect(() => serverEnv({ ...complete, SESSION_SECRET: "   " })).toThrow(
      MissingEnvError,
    );
  });

  it("rejects a non numeric house temperature", () => {
    expect(() =>
      serverEnv({ ...complete, HOUSE_TEMPERATURE: "cold" }),
    ).toThrow(/HOUSE_TEMPERATURE/);
  });

  it("defaults the house temperature to zero when absent", () => {
    const rest: EnvSource = { ...complete };
    delete rest.HOUSE_TEMPERATURE;
    expect(serverEnv(rest).HOUSE_TEMPERATURE).toBe(0);
  });
});

describe("parseAdminWallets", () => {
  it("lowercases and drops empty entries", () => {
    expect(parseAdminWallets(" 0xAB , ,0xCd ")).toEqual(["0xab", "0xcd"]);
  });

  it("returns an empty list for an empty string", () => {
    expect(parseAdminWallets("")).toEqual([]);
  });
});

describe("isAdmin", () => {
  const env = serverEnv(complete);

  it("matches case insensitively", () => {
    expect(isAdmin(env, "0xAaA")).toBe(true);
  });

  it("rejects a non admin wallet", () => {
    expect(isAdmin(env, "0x111")).toBe(false);
  });
});

describe("ROBINHOOD_CHAIN_ID", () => {
  it("is 4663", () => {
    expect(ROBINHOOD_CHAIN_ID).toBe(4663);
  });
});
