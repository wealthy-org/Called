export interface ResultBlockProps {
  status: "settled" | "void";
  outcome: boolean | null;
  test: string;
  readingValue: string | number | null;
  readingBlock: number | null;
}

export function ResultBlock({
  status,
  outcome,
  test,
  readingValue,
  readingBlock,
}: ResultBlockProps) {
  const word = status === "void" ? "VOID" : outcome ? "YES" : "NO";

  return (
    <div className="border-t border-line pt-4">
      <p className="font-mono text-xs uppercase text-mute">Result</p>
      <p className="mt-1 font-display text-3xl text-bone">{word}</p>

      {readingValue !== null ? (
        <p className="mt-1 font-mono text-xs text-mute">
          reading {readingValue}
          {readingBlock !== null ? ` at block ${readingBlock}` : ""}
        </p>
      ) : null}

      {status === "void" ? (
        <p className="mt-1 font-mono text-xs text-mute">
          no trustworthy number could be read from the source
        </p>
      ) : (
        <p className="mt-1 font-mono text-xs text-mute">test {test}</p>
      )}
    </div>
  );
}