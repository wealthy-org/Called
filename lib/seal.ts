import { sha256Hex } from "./hash";

export interface SealPayload {
  p: number;
  handle: string;
  rationale: string;
}

export interface ChainRecordInput {
  index: number;
  commit: string;
  sealedAt: Date;
  prev: string;
}

export interface ChainRecord extends ChainRecordInput {
  sealedAt: Date;
  hash: string;
}

export function commitHash(payloadJson: string, salt: string): Promise<string> {
  return sha256Hex(`${payloadJson}|${salt}`);
}

export function recordHash(
  index: number,
  commit: string,
  sealedAt: Date,
  prev: string,
): Promise<string> {
  return sha256Hex(
    `${index}|${commit}|${sealedAt.toISOString()}|${prev}`,
  );
}

export async function computeCommit(payload: SealPayload, salt: string): Promise<string> {
  return commitHash(stablePayloadJson(payload), salt);
}

export function stablePayloadJson(payload: SealPayload): string {
  return JSON.stringify({
    p: payload.p,
    handle: payload.handle,
    rationale: payload.rationale,
  });
}

export async function buildChainRecord(
  input: ChainRecordInput,
): Promise<ChainRecord> {
  return {
    ...input,
    hash: await recordHash(
      input.index,
      input.commit,
      input.sealedAt,
      input.prev,
    ),
  };
}
export function validateProbability(p: number): string | null {
  if (!Number.isFinite(p)) {
    return "p must be a finite number between 0 and 1";
  }
  if (p < 0 || p > 1) {
    return "p must be between 0 and 1";
  }
  return null;
}
