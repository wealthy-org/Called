export const ROBINHOOD_CHAIN_ID = 4663;

export interface ServerEnv {
  DATABASE_URL: string;
  RECEIPT_SIGNING_KEY: string;
  SESSION_SECRET: string;
  ADMIN_WALLETS: string[];
  CRON_SECRET: string;
  ROBINHOOD_RPC_URL: string;
  ANCHOR_PRIVATE_KEY: string;
  PAYLOAD_ENCRYPTION_KEY: string;
  HOUSE_TEMPERATURE: number;
}

export interface PublicEnv {
  ROBINHOOD_CHAIN_ID: number;
}

export type EnvSource = Record<string, string | undefined>;

export class MissingEnvError extends Error {
  constructor(readonly variables: readonly string[]) {
    super(`Missing required environment variable(s): ${variables.join(", ")}`);
    this.name = "MissingEnvError";
  }
}

export class InvalidEnvError extends Error {
  constructor(
    readonly variable: string,
    readonly problem: string,
  ) {
    super(`Environment variable ${variable} ${problem}`);
    this.name = "InvalidEnvError";
  }
}

function read(source: EnvSource, name: string): string {
  return source[name]!.trim();
}

function collect(
  source: EnvSource,
  names: readonly string[],
): void {
  const missing = names.filter(
    (name) => source[name] === undefined || source[name]!.trim().length === 0,
  );
  if (missing.length > 0) {
    throw new MissingEnvError(missing);
  }
}

export function parseAdminWallets(raw: string): string[] {
  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

export function serverEnv(
  source: EnvSource = process.env,
): ServerEnv {
  collect(source, [
    "DATABASE_URL",
    "RECEIPT_SIGNING_KEY",
    "SESSION_SECRET",
    "ADMIN_WALLETS",
    "CRON_SECRET",
    "ROBINHOOD_RPC_URL",
    "ANCHOR_PRIVATE_KEY",
    "PAYLOAD_ENCRYPTION_KEY",
  ]);

  const temperature = source.HOUSE_TEMPERATURE?.trim();
  const parsedTemperature =
    temperature === undefined || temperature === "" ? 0 : Number(temperature);
  if (Number.isNaN(parsedTemperature)) {
    throw new InvalidEnvError("HOUSE_TEMPERATURE", "must be a number");
  }

  return {
    DATABASE_URL: read(source, "DATABASE_URL"),
    RECEIPT_SIGNING_KEY: read(source, "RECEIPT_SIGNING_KEY"),
    SESSION_SECRET: read(source, "SESSION_SECRET"),
    ADMIN_WALLETS: parseAdminWallets(read(source, "ADMIN_WALLETS")),
    CRON_SECRET: read(source, "CRON_SECRET"),
    ROBINHOOD_RPC_URL: read(source, "ROBINHOOD_RPC_URL"),
    ANCHOR_PRIVATE_KEY: read(source, "ANCHOR_PRIVATE_KEY"),
    PAYLOAD_ENCRYPTION_KEY: read(source, "PAYLOAD_ENCRYPTION_KEY"),
    HOUSE_TEMPERATURE: parsedTemperature,
  };
}

export function isAdmin(env: ServerEnv, walletAddress: string): boolean {
  return env.ADMIN_WALLETS.includes(walletAddress.trim().toLowerCase());
}
