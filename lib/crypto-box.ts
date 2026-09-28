import { utf8ToBytes, bytesToHex, hexToBytes } from "./hash";

export const SALT_BYTES = 16;
export const ENCRYPTION_IV_BYTES = 12;

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

async function deriveAesKey(secret: string): Promise<CryptoKey> {
  const material = await globalThis.crypto.subtle.importKey(
    "raw",
    toArrayBuffer(utf8ToBytes(secret)),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return globalThis.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(utf8ToBytes("called-payload-v1")),
      iterations: 100_000,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export function newSalt(): string {
  return bytesToHex(globalThis.crypto.getRandomValues(new Uint8Array(SALT_BYTES)));
}

export async function encryptPayload(
  plaintext: string,
  secret: string,
): Promise<string> {
  const key = await deriveAesKey(secret);
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(ENCRYPTION_IV_BYTES));
  const ciphertext = await globalThis.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    toArrayBuffer(utf8ToBytes(plaintext)),
  );

  return `${bytesToHex(iv)}.${bytesToHex(new Uint8Array(ciphertext))}`;
}

export async function decryptPayload(
  envelope: string,
  secret: string,
): Promise<string | null> {
  const [ivHex, dataHex] = envelope.split(".");
  if (ivHex === undefined || dataHex === undefined) {
    return null;
  }

  let key: CryptoKey;
  try {
    key = await deriveAesKey(secret);
  } catch {
    return null;
  }

  try {
    const plaintext = await globalThis.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: toArrayBuffer(hexToBytes(ivHex)) },
      key,
      toArrayBuffer(hexToBytes(dataHex)),
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
}
