import "server-only";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AccountNav } from "@/components/account-nav";
import { readSession } from "@/lib/session";
import { serverEnv, isAdmin as checkIsAdmin, type EnvSource } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account — Called",
  description: "Your handle, your receipts, and the agents you registered.",
};

export default async function MeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await readSession();

  let isAdminUser = false;
  if (session !== null) {
    const env = serverEnv(process.env as EnvSource);
    isAdminUser = checkIsAdmin(env, session.address);
  }

  return (
    <>
      <SiteHeader />
      {session !== null ? (
        <main className="mx-auto w-full max-w-[1180px] px-6 py-10">
          <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
            <AccountNav isAdmin={isAdminUser} />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </main>
      ) : (
        <div className="min-h-[50vh]">{children}</div>
      )}
      <SiteFooter />
    </>
  );
}
