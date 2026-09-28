import { findVagueWords } from "@/config/vague";
import { isParseableTest } from "@/lib/test-grammar";

export const MIN_TEXT_LENGTH = 15;
export const MAX_TEXT_LENGTH = 240;

export const READABLE_SOURCE_SCHEMES = [
  "dex.twap",
  "oracle",
  "manual",
] as const;

export type RejectionReason =
  | "text_length"
  | "vague_word"
  | "missing_source"
  | "unreadable_source"
  | "unparseable_test"
  | "missing_resolve_date"
  | "past_resolve_date"
  | "close_after_resolve";

export interface AskInput {
  text: string;
  source: string;
  test: string;
  resolvesAt: Date;
  closesAt: Date;
  now?: Date;
}

export type AskResult =
  | { ok: true }
  | { ok: false; reason: RejectionReason; message: string; detail?: string };

function isReadableSource(source: string): boolean {
  return READABLE_SOURCE_SCHEMES.some(
    (scheme) => source === scheme || source.startsWith(`${scheme}:`),
  );
}

export function validateAsk(input: AskInput): AskResult {
  const now = input.now ?? new Date();
  const text = input.text.trim();

  if (text.length < MIN_TEXT_LENGTH || text.length > MAX_TEXT_LENGTH) {
    return {
      ok: false,
      reason: "text_length",
      message: `Text must be ${MIN_TEXT_LENGTH}-${MAX_TEXT_LENGTH} characters (got ${text.length}).`,
    };
  }

  const vague = findVagueWords(text);
  if (vague.length > 0) {
    return {
      ok: false,
      reason: "vague_word",
      message: `Text contains vague word(s): ${vague.join(", ")}.`,
      detail: vague.join(", "),
    };
  }

  if (input.source.trim().length === 0) {
    return {
      ok: false,
      reason: "missing_source",
      message: "A readable resolution source is required.",
    };
  }

  if (!isReadableSource(input.source.trim())) {
    return {
      ok: false,
      reason: "unreadable_source",
      message: `Source is not a supported readable source: ${input.source}`,
    };
  }

  if (!isParseableTest(input.test)) {
    return {
      ok: false,
      reason: "unparseable_test",
      message: `Test is not a yes/no comparison: ${input.test}`,
    };
  }

  if (Number.isNaN(input.resolvesAt.getTime())) {
    return {
      ok: false,
      reason: "missing_resolve_date",
      message: "A resolution date is required.",
    };
  }

  if (input.resolvesAt.getTime() <= now.getTime()) {
    return {
      ok: false,
      reason: "past_resolve_date",
      message: "Resolution date must be in the future.",
    };
  }

  if (input.closesAt.getTime() >= input.resolvesAt.getTime()) {
    return {
      ok: false,
      reason: "close_after_resolve",
      message: "Seal close must be before the resolution date.",
    };
  }

  return { ok: true };
}
