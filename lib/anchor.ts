import {
  createPublicClient,
  createWalletClient,
  http,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bytesToHex, hexToBytes } from "./hash";

export const ANCHOR_TAG = "CALL";
export const ANCHOR_TAG_BYTES = 4;
export const HEAD_HASH_BYTES = 32;
export const RECORD_COUNT_BYTES = 8;
export const ANCHOR_CALLDATA_BYTES =
  ANCHOR_TAG_BYTES + HEAD_HASH_BYTES + RECORD_COUNT_BYTES;

export const HEAD_HASH_HEX_LENGTH = HEAD_HASH_BYTES * 2;

export interface DecodedAnchor {
  tag: string;
  headHash: string;
  recordCount: number;
}

export function normalizeHeadHash(headHash: string): string {
  const stripped = headHash.startsWith("0x") ? headHash.slice(2) : headHash;
  const lower = stripped.toLowerCase();
  if (lower.length !== HEAD_HASH_HEX_LENGTH || !/^[0-9a-f]+$/.test(lower)) {
    throw new Error(
      `head hash must be ${HEAD_HASH_HEX_LENGTH} lowercase hex characters`,
    );
  }
  return lower;
}

function asciiToBytes(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i += 1) {
    bytes[i] = value.charCodeAt(i) & 0xff;
  }
  return bytes;
}

function bytesToAscii(bytes: Uint8Array): string {
  let out = "";
  for (const byte of bytes) {
    out += String.fromCharCode(byte);
  }
  return out;
}

function uint64ToBytes(value: number): Uint8Array {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error("record count must be a non-negative safe integer");
  }
  const bytes = new Uint8Array(RECORD_COUNT_BYTES);
  let remaining = BigInt(value);
  for (let i = RECORD_COUNT_BYTES - 1; i >= 0; i -= 1) {
    bytes[i] = Number(remaining & 0xffn);
    remaining >>= 8n;
  }
  return bytes;
}

function bytesToUint64(bytes: Uint8Array): number {
  let value = 0n;
  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
  }
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("record count in anchor exceeds safe integer range");
  }
  return Number(value);
}

export function encodeAnchorCalldata(
  headHash: string,
  recordCount: number,
): Hex {
  const hash = normalizeHeadHash(headHash);
  const tag = asciiToBytes(ANCHOR_TAG);
  const hashBytes = hexToBytes(hash);
  const countBytes = uint64ToBytes(recordCount);

  const data = new Uint8Array(ANCHOR_CALLDATA_BYTES);
  data.set(tag, 0);
  data.set(hashBytes, ANCHOR_TAG_BYTES);
  data.set(countBytes, ANCHOR_TAG_BYTES + HEAD_HASH_BYTES);

  return `0x${bytesToHex(data)}` as Hex;
}

export function decodeAnchorCalldata(data: string): DecodedAnchor {
  const hex = data.startsWith("0x") ? data.slice(2) : data;
  if (hex.length !== ANCHOR_CALLDATA_BYTES * 2) {
    throw new Error(
      `anchor calldata must be ${ANCHOR_CALLDATA_BYTES} bytes, got ${hex.length / 2}`,
    );
  }
  const bytes = hexToBytes(hex);
  const tag = bytesToAscii(bytes.slice(0, ANCHOR_TAG_BYTES));
  if (tag !== ANCHOR_TAG) {
    throw new Error(`unexpected anchor tag: ${tag}`);
  }

  return {
    tag,
    headHash: bytesToHex(
      bytes.slice(ANCHOR_TAG_BYTES, ANCHOR_TAG_BYTES + HEAD_HASH_BYTES),
    ),
    recordCount: bytesToUint64(bytes.slice(ANCHOR_TAG_BYTES + HEAD_HASH_BYTES)),
  };
}

export function verifyAnchorCalldata(
  data: string,
  headHash: string,
  recordCount: number,
): boolean {
  try {
    const decoded = decodeAnchorCalldata(data);
    return (
      decoded.headHash === normalizeHeadHash(headHash) &&
      decoded.recordCount === recordCount
    );
  } catch {
    return false;
  }
}

export interface AnchorChainConfig {
  rpcUrl: string;
  privateKey: string;
  chainId: number;
}

export interface AnchorTransaction {
  txHash: string;
  blockNumber: number;
  blockTime: Date;
}

function toHexPrivateKey(privateKey: string): Hex {
  const trimmed = privateKey.trim();
  return (trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`) as Hex;
}

export async function sendAnchorTx(
  config: AnchorChainConfig,
  headHash: string,
  recordCount: number,
): Promise<AnchorTransaction> {
  const data = encodeAnchorCalldata(headHash, recordCount);
  const account = privateKeyToAccount(toHexPrivateKey(config.privateKey));

  const chain = {
    id: config.chainId,
    name: "Robinhood Chain",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [config.rpcUrl] } },
  } as const;

  const wallet = createWalletClient({
    account,
    chain,
    transport: http(config.rpcUrl),
  });
  const client = createPublicClient({
    chain,
    transport: http(config.rpcUrl),
  });

  const txHash = await wallet.sendTransaction({
    to: account.address,
    value: 0n,
    data,
  });

  const receipt = await client.waitForTransactionReceipt({ hash: txHash });
  const block = await client.getBlock({ blockNumber: receipt.blockNumber });

  return {
    txHash,
    blockNumber: Number(receipt.blockNumber),
    blockTime: new Date(Number(block.timestamp) * 1000),
  };
}
