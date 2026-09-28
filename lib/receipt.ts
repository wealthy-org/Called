import { bytesToHex, hexToBytes } from "./hash";

const ED25519 = { name: "Ed25519" } as const;

const PKCS8_PREFIX = new Uint8Array([
  0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04,
  0x22, 0x04, 0x20,
]);

const SPKI_PREFIX = new Uint8Array([
  0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00,
]);

export const SEED_BYTES = 32;
export const PUBLIC_KEY_BYTES = 32;
export const SIGNATURE_BYTES = 64;

function decodeSeed(secret: string): Uint8Array {
  const trimmed = secret.trim();

  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return hexToBytes(trimmed);
  }

  const decoded = Uint8Array.from(atob(trimmed), (char) => char.charCodeAt(0));
  if (decoded.length !== SEED_BYTES) {
    throw new Error(
      `RECEIPT_SIGNING_KEY must be ${SEED_BYTES} bytes as hex or base64 (got ${decoded.length})`,
    );
  }
  return decoded;
}

function concat(prefix: Uint8Array, body: Uint8Array): Uint8Array {
  const out = new Uint8Array(prefix.length + body.length);
  out.set(prefix, 0);
  out.set(body, prefix.length);
  return out;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

export async function importSigningKey(secret: string): Promise<CryptoKey> {
  const pkcs8 = concat(PKCS8_PREFIX, decodeSeed(secret));
  return globalThis.crypto.subtle.importKey(
    "pkcs8",
    toArrayBuffer(pkcs8),
    ED25519,
    true,
    ["sign"],
  );
}

export async function receiptPublicKey(secret: string): Promise<string> {
  const key = await importSigningKey(secret);
  const jwk = await globalThis.crypto.subtle.exportKey("jwk", key);
  const x = jwk.x;

  if (typeof x !== "string" || x.length === 0) {
    throw new Error("Ed25519 JWK export did not include a public key");
  }

  const raw = base64UrlToBytes(x);
  if (raw.length !== PUBLIC_KEY_BYTES) {
    throw new Error(`unexpected Ed25519 public key length: ${raw.length}`);
  }

  return bytesToBase64(raw);
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

export function importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(publicKeyBase64), (char) => char.charCodeAt(0));
  if (raw.length !== PUBLIC_KEY_BYTES) {
    throw new Error(`public key must be ${PUBLIC_KEY_BYTES} bytes base64`);
  }
  return globalThis.crypto.subtle.importKey(
    "spki",
    toArrayBuffer(concat(SPKI_PREFIX, raw)),
    ED25519,
    true,
    ["verify"],
  );
}

export interface ReceiptFields {
  receiptId: string;
  sealId: string;
  recordIndex: number;
  commit: string;
  recordHash: string;
  sealedAt: Date;
  questionId: string;
  forecasterId: string;
}

export function receiptMessage(fields: ReceiptFields): string {
  return [
    "called-receipt-v1",
    fields.receiptId,
    fields.sealId,
    fields.questionId,
    fields.forecasterId,
    String(fields.recordIndex),
    fields.commit,
    fields.recordHash,
    fields.sealedAt.toISOString(),
  ].join("|");
}

export async function signReceipt(
  secret: string,
  fields: ReceiptFields,
): Promise<string> {
  const key = await importSigningKey(secret);
  const signature = await globalThis.crypto.subtle.sign(
    ED25519,
    key,
    new TextEncoder().encode(receiptMessage(fields)),
  );

  const bytes = new Uint8Array(signature);
  if (bytes.length !== SIGNATURE_BYTES) {
    throw new Error(`unexpected Ed25519 signature length: ${bytes.length}`);
  }

  return bytesToHex(bytes);
}

export async function verifyReceipt(
  publicKeyBase64: string,
  fields: ReceiptFields,
  signatureHex: string,
): Promise<boolean> {
  if (!/^[0-9a-fA-F]{128}$/.test(signatureHex)) {
    return false;
  }

  try {
    const key = await importPublicKey(publicKeyBase64);
    return await globalThis.crypto.subtle.verify(
      ED25519,
      key,
      toArrayBuffer(hexToBytes(signatureHex.toLowerCase())),
      new TextEncoder().encode(receiptMessage(fields)),
    );
  } catch {
    return false;
  }
}
