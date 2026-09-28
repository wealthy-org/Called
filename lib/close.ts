import { decryptPayload } from "./crypto-box";
import { parseRevealPayload, type RevealPayloadShape } from "./reveal";
import { stablePayloadJson } from "./seal";

export type QuestionStatus = "open" | "closed" | "settled" | "void";

export const CLOSE_REQUIRED_STATUS = "closed" as const;

export function isCloseDue(closesAt: Date, now: Date): boolean {
  return now.getTime() >= closesAt.getTime();
}

export interface RevealedPrediction {
  sealId: string;
  forecasterId: string;
  payload: RevealPayloadShape;
}

/**
 * Rebuilds the exact JSON string that was committed at seal time, so the
 * commit can be re-derived from the revealed plaintext. Key order must match
 * `stablePayloadJson` or the recomputed hash will not match.
 */
export function payloadJsonFor(payload: RevealPayloadShape): string {
  return stablePayloadJson({
    p: payload.p,
    handle: payload.handle,
    rationale: payload.rationale,
  });
}

export interface DecryptRevealInput {
  ciphertext: string;
  salt: string;
  payloadJson: string;
  key: string;
}

/**
 * Decrypts the pre-reveal envelope and cross-checks it against the plaintext
 * the forecaster submitted at reveal time. A mismatch means the sealed payload
 * and the revealed payload disagree, so the record must not be scored.
 */
export async function openSealedPayload(
  input: DecryptRevealInput,
): Promise<RevealPayloadShape | null> {
  const plaintext = await decryptPayload(input.ciphertext, input.key);
  if (plaintext === null) {
    return null;
  }
  if (plaintext !== input.payloadJson) {
    return null;
  }
  return parseRevealPayload(plaintext);
}
