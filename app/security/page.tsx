import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/Reveal";
import { company } from "@/lib/company";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  path: "/security",
  title: "Security",
  description:
    "How LoopSignal handles operational data during a LoopScan: read-only, in your environment, nothing trains a model.",
});

export default function SecurityPage() {
  return (
    <section className="border-b border-line py-20 md:py-28">
      <Container>
        <Eyebrow>Security</Eyebrow>
        <h1 className="mt-5 max-w-3xl text-4xl font-medium tracking-[-0.035em] text-ink md:text-6xl">
          Read-only. In your environment. Nothing trains a model.
        </h1>
        <div className="mt-10 max-w-2xl space-y-6 text-[16px] leading-8 text-graphite">
          <p>
            A LoopScan looks at how work actually happens. When that requires a
            data pull, it is read-only. We do not write back to your systems.
          </p>
          <p>
            The work runs in your environment. We do not take a live operational
            feed into a LoopSignal product, because we do not sell a product
            that holds your data.
          </p>
          <p>
            Nothing from your plant trains a model. Not ours. Not a third
            party’s.
          </p>
          <p>
            When the engagement ends, we hand you the raw pull and the queries
            used to produce the findings, then delete our copy.
          </p>
          <p>
            Questions:{" "}
            <a
              href={`mailto:${company.contactEmail}`}
              className="text-copper hover:text-copper-dark"
            >
              {company.contactEmail}
            </a>
            .
          </p>
        </div>
      </Container>
    </section>
  );
}
