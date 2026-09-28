import Link from "next/link";

export function WorkspaceFooter() {
  return (
    <footer className="border-t border-line">
      <div className="wrap py-10">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <p className="font-display text-2xl font-bold text-bone">Called</p>
          <span className="font-mono text-xs text-mute">
            Scoring adapted from{" "}
            <a
              href="https://github.com/Noisyxl/brier"
              className="text-bone hover:text-seal"
              rel="noreferrer noopener"
              target="_blank"
            >
              brier
            </a>{" "}
            (MIT).
          </span>
          <span className="font-mono text-xs text-mute">
            Read the full attribution on{" "}
            <Link href="/third-party" className="text-bone hover:text-seal">
              Third-party notices
            </Link>
            .
          </span>
        </div>
      </div>
    </footer>
  );
}
