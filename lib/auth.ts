import { getAddress, isAddressEqual, recoverMessageAddress } from "viem";
import { randomBytes } from "node:crypto";
import { sha256Hex } from "./hash";

export const NONCE_BYTES = 16;
export const SESSION_COOKIE = "called_session";
export const NONCE_COOKIE = "called_nonce";
export const NONCE_TTL_SECONDS = 15 * 60;
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface SiweMessageFields {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: "1",
  chainId: number;
  nonce: string;
  issuedAt: string;
}

export function newNonce(): string {
  return randomBytes(NONCE_BYTES).toString("hex");
}

export function buildSiweMessage(
  fields: SiweMessageFields,
  expirationTime?: string,
): string {
  const lines = [
    `${fields.domain} wants you to sign in with your wallet:`,
    fields.address,
    "",
    fields.statement,
    "",
    `URI: ${fields.uri}`,
    "Version: 1",
    `Chain ID: ${fields.chainId}`,
    `Nonce: ${fields.nonce}`,
    `Issued At: ${fields.issuedAt}`,
  ];
  if (expirationTime !== undefined) {
    lines.push(`Expiration Time: ${expirationTime}`);
  }
  return lines.join("\n");
}

export interface VerifySiweInput {
  message: string;
  signature: `0x${string}`;
  expectedNonce: string;
  expectedChainId: number;
  expectedDomain: string;
  expectedUri: string;
}

export type VerifySiweResult =
  | { ok: true; address: string }
  | { ok: false; reason: string };

function parseField(message: string, label: string): string | undefined {
  const match = message.match(new RegExp(`^${label}: (.+)$`, "m"));
  return match?.[1]?.trim();
}

export async function verifySiweMessage(
  input: VerifySiweInput,
): Promise<VerifySiweResult> {
  const { message, signature } = input;

  const address = message.split("\n")[1]?.trim();
  if (address === undefined || !address.startsWith("0x")) {
    return { ok: false, reason: "message has no wallet address" };
  }

  const nonce = parseField(message, "Nonce");
  if (nonce !== input.expectedNonce) {
    return { ok: false, reason: "nonce mismatch" };
  }

  const chainId = parseField(message, "Chain ID");
  if (chainId !== String(input.expectedChainId)) {
    return { ok: false, reason: "chain id mismatch" };
  }

  const uri = parseField(message, "URI");
  if (uri !== input.expectedUri) {
    return { ok: false, reason: "uri mismatch" };
  }

  const messageDomain = message.split("\n")[0]?.split(" ")[0];
  if (messageDomain !== input.expectedDomain) {
    return { ok: false, reason: "domain mismatch" };
  }

  const version = parseField(message, "Version");
  if (version !== "1") {
    return { ok: false, reason: "unsupported siwe version" };
  }

  const expiration = parseField(message, "Expiration Time");
  if (expiration !== undefined) {
    const expiresAt = Date.parse(expiration);
    if (Number.isNaN(expiresAt)) {
      return { ok: false, reason: "malformed expiration time" };
    }
    if (expiresAt <= Date.now()) {
      return { ok: false, reason: "message expired" };
    }
  }

  let recovered: string;
  try {
    recovered = await recoverMessageAddress({ message, signature });
  } catch {
    return { ok: false, reason: "signature does not match address" };
  }

  if (!isAddressEqual(getAddress(recovered), getAddress(address))) {
    return { ok: false, reason: "signature does not match address" };
  }

  return { ok: true, address: getAddress(address) };
}

export async function sessionToken(
  address: string,
  secret: string,
): Promise<string> {
  return sha256Hex(`${secret}|${getAddress(address)}`);
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
} as const;
