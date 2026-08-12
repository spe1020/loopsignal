import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactForm } from "@/components/ContactForm";
import { Container, Eyebrow } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Talk to Us",
  description:
    "Show us the process your team hates doing. LoopWorks will help you make it better.",
};

export default function TalkToUsPage() {
  return (
    <section className="py-20 md:py-28">
      <Container className="grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Eyebrow>Talk to us</Eyebrow>
          <h1 className="mt-5 text-4xl font-medium tracking-[-0.035em] text-ink md:text-5xl">
            Show us the process.
          </h1>
          <p className="mt-6 text-[16px] leading-8 text-graphite">
            Every organization has work that takes too long, information that is
            difficult to find, and decisions that happen later than they should.
          </p>
          <p className="mt-4 text-[16px] leading-8 text-graphite">
            That is where we start. Tell us what your team is doing by hand —
            chasing POs, assembling reports, searching for specs — and we will
            tell you whether it is a good first loop.
          </p>
          <div className="mt-10 space-y-4 border-t border-line pt-8 text-sm leading-6 text-graphite">
            <p>
              <span className="font-medium text-ink">LoopScan</span> — a focused
              look at where better systems would change the work.
            </p>
            <p>
              <span className="font-medium text-ink">LoopBuild</span> — turn one
              high-value opportunity into a working system.
            </p>
            <p>
              <span className="font-medium text-ink">LoopOps</span> — keep
              improving after the first loop is live.
            </p>
          </div>
        </div>
        <div className="lg:col-span-7">
          <Suspense
            fallback={
              <div className="h-96 border border-line bg-paper" />
            }
          >
            <ContactForm />
          </Suspense>
        </div>
      </Container>
    </section>
  );
}
