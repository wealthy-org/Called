const encoder = new TextEncoder();

export function bytesToHex(bytes: Uint8Array): string {
  let hex = "";
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
}

export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error("hex string must have even length");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    const byte = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(byte)) {
      throw new Error(`invalid hex at offset ${i * 2}`);
    }
    bytes[i] = byte;
  }
  return bytes;
}

export function utf8ToBytes(input: string): Uint8Array {
  return encoder.encode(input);
}

export async function sha256Bytes(input: Uint8Array): Promise<Uint8Array> {
  const source = new Uint8Array(input);
  const view = source.buffer.slice(
    source.byteOffset,
    source.byteOffset + source.byteLength,
  ) as ArrayBuffer;
  const digest = await globalThis.crypto.subtle.digest("SHA-256", view);
  return new Uint8Array(digest);
}

export function sha256Hex(input: string): Promise<string> {
  return sha256Bytes(utf8ToBytes(input)).then(bytesToHex);
}

export function sha256HexOfParts(parts: readonly string[]): Promise<string> {
  return sha256Hex(parts.join("|"));
}

export const GENESIS_PREV_HASH = "0".repeat(64);
