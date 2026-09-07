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
            If you send the pilot or LoopScan form, we receive your name, company, role,
            email or phone, and anything you wrote about what&apos;s slowing you
            down. That submission goes to Formspree, then to us. We use it to
            set up a conversation. We do not sell it.
          </p>
          <p>
            Public pages use Vercel Analytics for page views and button clicks. Company workspace routes suppress analytics, attribution collection, and speed insights.
            Those events do not include names, email addresses, or the text you
            type into the form. We do not use Google Analytics.
          </p>
          <p>
            The public examples run on fictional sample data. The new product preview stores its progress separately in this browser. The individual LoopSolve and LoopFlow tools can import your JSON files and keep those documents on this device; they do not silently upload them. Export copies for recovery, because browser storage is not a cloud backup.
          </p>
          <p>The separate company evaluation uses authenticated shared storage when configured. Explicitly confirmed imports upload a copy; originals stay on the device. Company sessions use HTTP-only cookies. Company drafts remain in the current editor until the server confirms a save; recovery export is explicit.</p>
          <p>Deleted company records are hidden immediately. Object removal and a 30-day record purge have operator tools, but no hosted maintenance or backup schedule has been deployed. Provider-backed recovery, retention, and access checks remain prerequisites for real customer data. The evaluation accepts synthetic invitations and test billing only.</p>
          <p>
            To ask a question or request deletion: {company.contactEmail}.
          </p>
        </div>
      </Container>
    </section>
  );
}
