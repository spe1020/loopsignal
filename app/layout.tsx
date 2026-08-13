import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SiteAnalytics } from "@/components/SiteAnalytics";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const ibmSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-sans",
});

const ibmSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-ibm-serif",
});

export const metadata: Metadata = {
  title: {
    default: "LoopWorks — Better systems. Better work.",
    template: "%s — LoopWorks",
  },
  description:
    "LoopWorks helps manufacturers identify operational friction, improve processes, and build practical AI and automation systems that make work faster, clearer, and more reliable.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "LoopWorks — Better systems. Better work.",
    description:
      "LoopWorks helps manufacturers make work better using smarter systems.",
    url: "/",
    siteName: "LoopWorks",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  ...(process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION } }
    : {}),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${ibmSans.variable} ${ibmSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream font-sans text-ink">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <SiteAnalytics />
      </body>
    </html>
  );
}
