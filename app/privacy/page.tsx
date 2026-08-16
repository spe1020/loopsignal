import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/Reveal";
import { company } from "@/lib/company";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  path: "/privacy",
  title: "Privacy",
  description:
    "What LoopSignal collects on this site, what we do with it, and how to reach us.",
});

export default function PrivacyPage() {
  return (
    <section className="border-b border-line py-20 md:py-28">
      <Container>
        <Eyebrow>Privacy</Eyebrow>
        <h1 className="mt-5 max-w-3xl text-4xl font-medium tracking-[-0.035em] text-ink md:text-6xl">
          What this site collects.
        </h1>
        <div className="mt-10 max-w-2xl space-y-6 text-[16px] leading-8 text-graphite">
          <p>
            If you send the LoopScan form, we receive your name, work email,
            role, company, and the process you described. That submission goes
            to Formspree, then to us. We use it to follow up about the work. We
            do not sell it.
          </p>
          <p>
            This site uses Vercel Analytics for page views and button clicks.
            Those events do not include names, email addresses, or the text you
            type into the form. We do not use Google Analytics.
          </p>
          <p>
            The public demos run on fictional sample data. They do not take a
            file from you.
          </p>
          <p>
            To ask a question or request deletion: {company.contactEmail}.
          </p>
        </div>
      </Container>
    </section>
  );
}
