import { sha256HexOfParts } from "./hash";

export interface QuestionIdInput {
  text: string;
  date: string;
  source: string;
  test: string;
}

export function dateSegment(date: Date | string): string {
  if (typeof date !== "string") {
    return date.toISOString().slice(0, 10);
  }
  return date.slice(0, 10);
}

export async function questionId(input: QuestionIdInput): Promise<string> {
  const digest = await sha256HexOfParts([
    input.text,
    dateSegment(input.date),
    input.source,
    input.test,
  ]);
  return `q-${dateSegment(input.date)}-${digest.slice(0, 6)}`;
}
