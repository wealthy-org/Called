import type { Metadata } from "next";
import { LeaderboardSection } from "./leaderboard-section";
import { CalibrationPanel } from "./calibration-panel";
import { loadLeaderboardPage } from "./data";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Leaderboard — Called",
};

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const data = await loadLeaderboardPage();

  return (
    <>
      <SiteHeader />
    <main className="wrap section">
      <p className="kicker">Scoring</p>
      <h1 className="page-title">Leaderboard</h1>
      <p className="mt-5 max-w-[620px] text-lg text-mute">
        Ranked forecasts use settled questions only. Provisional forecasts stay visible without entering ranking.
      </p>
      <div className="lg:grid lg:grid-cols-[1.35fr_1fr] lg:gap-11">
        <div>
          <LeaderboardSection />
        </div>
        <div>
          <CalibrationPanel series={data.forecastSeries} />
        </div>
      </div>
      <section className="my-10 rounded-md border border-dashed border-line p-4 text-sm text-mute">
        Skill is measured against a baseline that always says yes on the same
        settled questions: skill = (baseline Brier − your Brier) ÷ baseline
        Brier. Forecasters with fewer than 20 settled answers are shown but not
        ranked. Unreadable results are marked void and never counted as a
        success or failure.
      </section>
    </main>
    <SiteFooter />
    </>
  );
}
