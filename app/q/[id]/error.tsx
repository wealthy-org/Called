"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="dossier-error">
      <p className="kicker">Error</p>
      <h1 className="page-title mt-4">Question could not be loaded.</h1>
      <p className="mt-4 text-mute">
        The question data is temporarily unavailable.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 h-11 rounded-field border border-line px-6 font-mono text-sm uppercase text-bone hover:border-seal hover:text-seal"
      >
        Try again
      </button>
    </div>
  );
}
