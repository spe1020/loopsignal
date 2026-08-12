import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
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
  metadataBase: new URL("https://loopworks.com"),
  openGraph: {
    title: "LoopWorks — Better systems. Better work.",
    description:
      "LoopWorks helps manufacturers make work better using smarter systems.",
    type: "website",
  },
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
      </body>
    </html>
  );
}
