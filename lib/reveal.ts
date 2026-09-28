import { commitHash } from "./seal";

export interface RevealInput {
  commit: string;
  payloadJson: string;
  salt: string;
}

export type RevealCheck =
  | { ok: true }
  | { ok: false; reason: "malformed_payload" | "commit_mismatch"; message: string };

export interface RevealPayloadShape {
  p: number;
  handle: string;
  rationale: string;
}

export function parseRevealPayload(payloadJson: string): RevealPayloadShape | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payloadJson);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }

  const candidate = parsed as Record<string, unknown>;
  if (typeof candidate.p !== "number" || !Number.isFinite(candidate.p)) {
    return null;
  }
  if (candidate.p < 0 || candidate.p > 1) {
    return null;
  }
  if (typeof candidate.handle !== "string" || candidate.handle.length === 0) {
    return null;
  }
  if (typeof candidate.rationale !== "string") {
    return null;
  }

  return {
    p: candidate.p,
    handle: candidate.handle,
    rationale: candidate.rationale,
  };
}

export function isRevealOpen(closesAt: Date, now: Date): boolean {
  return now.getTime() >= closesAt.getTime();
}

export async function checkReveal(input: RevealInput): Promise<RevealCheck> {
  if (input.salt.length === 0) {
    return {
      ok: false,
      reason: "malformed_payload",
      message: "salt is required to reveal a seal",
    };
  }

  if (parseRevealPayload(input.payloadJson) === null) {
    return {
      ok: false,
      reason: "malformed_payload",
      message: "payload is not a valid sealed prediction",
    };
  }

  const recomputed = await commitHash(input.payloadJson, input.salt);
  if (recomputed !== input.commit) {
    return {
      ok: false,
      reason: "commit_mismatch",
      message: "sha256(payload_json|salt) does not match the commit",
    };
  }

  return { ok: true };
}
