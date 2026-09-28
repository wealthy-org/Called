import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Third-party notices — Called",
  description: "Attribution, adaptations, and license notices for Called.",
};

const ADAPTATIONS = [
  ["Question gate (Ask)", "lib/ask-gate.ts, lib/test-grammar.ts, lib/question-id.ts, config/vague.ts"],
  ["Hash chain and commit-reveal", "lib/seal.ts, lib/seal-store.ts, lib/verify.ts, db/schema.ts (seals, seal_reveals)"],
  ["Public ledger and Verify", "app/ledger/page.tsx, app/ledger/verify.tsx, app/api/ledger/route.ts"],
  ["Chain-head anchoring (Anchor)", "lib/anchor.ts, lib/anchor-status.ts, app/api/cron/anchor/route.ts, app/anchor/[id]/page.tsx"],
  ["Scoring and leaderboard", "lib/scoring/brier.ts, lib/scoring/skill.ts, lib/scoring/murphy.ts, lib/scoring/leaderboard-core.ts, app/leaderboard/*"],
  ["Calibration", "lib/scoring/calibration.ts, components/calibration-plot.tsx"],
  ["Simple baselines", "lib/baselines.ts (Always-yes, Parrot, Hedgehog, Drift, Drunk)"],
] as const;

const VOCABULARY = [
  ["ask", "Ask"],
  ["seal", "Seal"],
  ["wait", "Wait"],
  ["settle", "Settle"],
  ["panel", "The Field"],
  ["ledger.jsonl", "Ledger"],
  ["anchor", "Anchor"],
  ["score, scoreboard", "Leaderboard"],
  ["calibrate", "Calibration"],
  ["ledger --verify", "Verify"],
  ["almanac", "Sample world"],
  ["hedgehog, parrot, drunk", "Hedgehog, Parrot, Drunk"],
  ["fox", "Drift"],
  ["always-yes", "Always-yes"],
  ["(none)", "Receipt"],
] as const;

export default function ThirdPartyPage() {
  return (
    <>
      <SiteHeader />
      <main className="wrap section">
        <p className="kicker">Attribution</p>
        <h1 className="page-title">Third-party notices</h1>
        <p className="mt-5 max-w-[680px] text-lg text-mute">
          Called contains original code. No source files, assets, or code
          snippets from other projects were copied into this repository. This
          page records the concept adaptations and naming patterns it borrows,
          along with their license.
        </p>

        <div className="mt-16 grid gap-16 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <h2 className="font-display text-3xl font-bold text-bone">brier</h2>
            <dl className="mt-5 space-y-4 font-mono text-sm">
              <div>
                <dt className="text-mute">PROJECT</dt>
                <dd className="mt-1 text-bone">brier</dd>
              </div>
              <div>
                <dt className="text-mute">SOURCE</dt>
                <dd className="mt-1 break-all">
                  <a
                    href="https://github.com/Noisyxl/brier"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-seal underline underline-offset-4 hover:text-bone"
                  >
                    github.com/Noisyxl/brier
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-mute">LICENSE</dt>
                <dd className="mt-1 text-bone">MIT</dd>
              </div>
            </dl>
          </aside>

          <div className="min-w-0 space-y-14">
            <section>
              <h2 className="font-display text-3xl font-bold text-bone">What was adapted</h2>
              <p className="mt-4 max-w-2xl text-mute">
                Every TypeScript file in this repository was written specifically
                for Called. What was taken from brier is the ideas and naming
                patterns, not the code.
              </p>
              <div className="table-wrap mt-6">
                <table>
                  <thead>
                    <tr><th>Idea from brier</th><th>Location in Called</th></tr>
                  </thead>
                  <tbody>
                    {ADAPTATIONS.map(([idea, location]) => (
                      <tr key={idea}>
                        <td className="text-bone">{idea}</td>
                        <td className="break-words font-mono text-xs text-mute">{location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="font-display text-3xl font-bold text-bone">Naming patterns</h2>
              <p className="mt-4 text-mute">
                This vocabulary was adopted so the product terms stay consistent.
              </p>
              <div className="table-wrap mt-6">
                <table>
                  <thead><tr><th>brier</th><th>Called</th></tr></thead>
                  <tbody>
                    {VOCABULARY.map(([source, called]) => (
                      <tr key={source}><td className="font-mono text-sm text-mute">{source}</td><td className="text-bone">{called}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="font-display text-3xl font-bold text-bone">Not used</h2>
              <ul className="mt-5 space-y-4 text-mute">
                <li>
                  The brier <span className="font-mono text-bone">fox</span>{" "}
                  forecaster is not used. Called ships its own baselines in{" "}
                  <span className="font-mono text-bone">lib/baselines.ts</span>.
                </li>
                <li>brier&apos;s visual assets, name, and UI text were not copied. Called&apos;s look follows its own product identity.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-3xl font-bold text-bone">MIT License</h2>
              <pre className="mt-5 max-w-full overflow-x-auto whitespace-pre-wrap border border-line bg-ink p-5 font-mono text-xs leading-relaxed text-mute">
{`MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}
              </pre>
            </section>
          </div>
        </div>
        <p className="mt-16 border-t border-line pt-6 text-sm text-mute">
          Full source: THIRD_PARTY.md in the repository root.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
