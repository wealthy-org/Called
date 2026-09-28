import { describe, expect, it } from "vitest";
import {
  InvalidEnvError,
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
  ROBINHOOD_RPC_URL: "https://rpc.test/chain-4663",
  ANCHOR_PRIVATE_KEY: "0xanchor",
  PAYLOAD_ENCRYPTION_KEY: "payload-encryption-key",
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
    expect(missing).toContain("ROBINHOOD_RPC_URL");
    expect(missing).toContain("ANCHOR_PRIVATE_KEY");
    expect(missing).toContain("PAYLOAD_ENCRYPTION_KEY");
    expect(missing).toHaveLength(8);
  });

  it("treats blank values as missing", () => {
    expect(() => serverEnv({ ...complete, SESSION_SECRET: "   " })).toThrow(
      MissingEnvError,
    );
  });

  it("rejects a non numeric house temperature with a named error", () => {
    let error: unknown;
    try {
      serverEnv({ ...complete, HOUSE_TEMPERATURE: "cold" });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(InvalidEnvError);
    expect((error as InvalidEnvError).variable).toBe("HOUSE_TEMPERATURE");
    expect((error as InvalidEnvError).message).toMatch(/must be a number/);
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
