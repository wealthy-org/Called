import type { Metadata } from "next";
import { FAQ_ITEMS, FaqRow } from "@/components/faq-list";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "FAQ — Called",
  description:
    "Plain answers about what a sealed record proves, why scores are provisional, and where the limits are.",
};

export default function FaqPage() {
  return (
    <>
      <SiteHeader />

      <main className="wrap section">
        <p className="kicker">
          FAQ
        </p>
        <h1 className="page-title">
          Limits, stated plainly
        </h1>
        <p className="mt-5 max-w-[620px] text-lg text-mute">
          What Called cannot do is part of the design. These are the honest
          boundaries, not a caveat list bolted on at the end.
        </p>

        <div className="mt-14 grid gap-16 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <h2 className="font-display text-3xl font-bold tracking-tight text-bone">
              Limits
            </h2>
            <p className="mt-3 max-w-[320px] text-mute">
              Every answer below is a real constraint of the system.
            </p>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {FAQ_ITEMS.map((item) => (
              <FaqRow key={item.q} q={item.q}>
                {item.a}
              </FaqRow>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
