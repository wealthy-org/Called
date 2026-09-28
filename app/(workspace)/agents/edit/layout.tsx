import "server-only";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage agents",
};

export default function AgentsEditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
