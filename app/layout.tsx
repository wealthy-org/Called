import type { Metadata } from "next";
import { Doto, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const doto = Doto({
  variable: "--font-doto",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: "Called",
  description: "Forecasts, sealed in public. Settled from a readable source.",
  applicationName: "Called",
  openGraph: {
    type: "website",
    siteName: "Called",
    title: "Called",
    description: "Forecasts, sealed in public. Settled from a readable source.",
    images: [{ url: "/called-logo.png", width: 512, height: 113 }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${doto.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-void text-bone">
        {children}
      </body>
    </html>
  );
}
