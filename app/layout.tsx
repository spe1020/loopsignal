import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SiteAnalytics } from "@/components/SiteAnalytics";
import { company } from "@/lib/company";
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
    default: `${company.name} — ${company.tagline}`,
    template: `%s — ${company.name}`,
  },
  description: company.executiveDescription,
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: `${company.name} — ${company.tagline}`,
    description: company.description,
    url: "/",
    siteName: company.name,
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: company.name,
  url: siteUrl,
  description: company.executiveDescription,
  slogan: company.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${ibmSans.variable} ${ibmSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream font-sans text-ink">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <SiteAnalytics />
      </body>
    </html>
  );
}
