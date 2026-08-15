"use client";

import { useEffect, useRef } from "react";
import { GoNoGoAid } from "@/components/know/GoNoGoAid";
import { KnowConsole } from "@/components/know/KnowConsole";
import { Container, Eyebrow } from "@/components/Reveal";
import { TrackedLink } from "@/components/TrackedLink";
import { trackKnowLoopScanClick, trackKnowPageView } from "@/lib/analytics";
import { shaftThreadGaugeAid } from "@/lib/know";

const marketingPrimary =
  "inline-flex items-center justify-center rounded-[2px] bg-copper px-6 py-3.5 text-[14px] font-medium tracking-[0.02em] text-white transition-colors hover:bg-copper-dark";
const marketingSecondary =
  "inline-flex items-center justify-center rounded-[2px] border border-ink/20 bg-transparent px-5 py-3 text-[13px] font-medium tracking-[0.02em] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream";

export function KnowDemo() {
  const demoRef = useRef<HTMLElement>(null);

  useEffect(() => {
    trackKnowPageView();
  }, []);

  function scrollToDemo() {
    demoRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <section className="relative overflow-hidden">
        <Container className="relative pt-12 pb-10 md:pt-16 md:pb-12">
          <Eyebrow>LoopKnow</Eyebrow>
          <h1 className="mt-4 max-w-3xl text-[36px] leading-[1.08] font-medium tracking-[-0.035em] text-ink sm:text-5xl md:text-[56px]">
            Your knowledge already exists. Make it usable.
          </h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-7 text-graphite md:text-[18px]">
            LoopKnow turns scattered manufacturing knowledge — SOPs,
            specifications, quality records, engineering documents, and
            institutional knowledge — into trusted, usable answers.
          </p>
          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-graphite">
            Ask a question. See the answer. Verify the source.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#demo"
              onClick={(event) => {
                event.preventDefault();
                scrollToDemo();
              }}
              className={marketingPrimary}
            >
              Try the Demo
            </a>
            <button
              type="button"
              onClick={() => {
                scrollToDemo();
                window.dispatchEvent(new Event("loopknow:view-documents"));
              }}
              className={marketingSecondary}
            >
              Explore Sample Documents
            </button>
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-paper py-12 md:py-16">
        <Container>
          <Eyebrow>WI-102 · Visual aid</Eyebrow>
          <h2 className="mt-4 max-w-2xl text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
            Show the accept and reject condition.
          </h2>
          <p className="mt-4 max-w-2xl text-[16px] leading-7 text-graphite">
            The CNC shaft work instruction includes a first-piece thread gauge
            check. Green is GO. Red is NO-GO. The lot is accepted only when both
            criteria are met.
          </p>
          <div className="mt-8 border border-line bg-cream p-5 md:p-6">
            <GoNoGoAid aid={shaftThreadGaugeAid} />
          </div>
        </Container>
      </section>

      <section ref={demoRef} id="demo" className="bg-console py-8 md:py-10">
        <div className="mx-auto w-full max-w-[1200px] px-6 lg:px-8">
          <KnowConsole />
        </div>
      </section>

      <section className="border-t border-line bg-cream py-16 md:py-20">
        <Container>
          <h2 className="max-w-2xl text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
            Your team already has the knowledge.
          </h2>
          <p className="mt-5 max-w-2xl text-[16px] leading-7 text-graphite">
            LoopSignal can help organize, connect, and make operational knowledge
            usable across the systems and documents your team already relies on.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <TrackedLink
              href="/loopscan?source=loopknow"
              location="loopknow"
              ctaText="Find Your First Loop"
              onClick={() =>
                trackKnowLoopScanClick({ cta_text: "Find Your First Loop" })
              }
              className={marketingPrimary}
            >
              Find Your First Loop
            </TrackedLink>
            <TrackedLink
              href="/loopscan?source=loopknow"
              location="loopknow"
              ctaText="Start a LoopScan"
              onClick={() =>
                trackKnowLoopScanClick({ cta_text: "Start a LoopScan" })
              }
              className="text-[14px] font-medium tracking-[0.02em] text-graphite hover:text-ink"
            >
              Start a LoopScan →
            </TrackedLink>
          </div>
        </Container>
      </section>
    </>
  );
}
