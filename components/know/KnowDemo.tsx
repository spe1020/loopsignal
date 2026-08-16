"use client";

import { useEffect, useRef } from "react";
import { DemoFlow } from "@/components/DemoCards";
import { GoNoGoAid } from "@/components/know/GoNoGoAid";
import { KnowConsole } from "@/components/know/KnowConsole";
import { Container, Eyebrow } from "@/components/Reveal";
import { TrackedLink } from "@/components/TrackedLink";
import { cta, demos } from "@/lib/content";
import { trackKnowLoopScanClick, trackKnowPageView } from "@/lib/analytics";
import { shaftThreadGaugeAid } from "@/lib/know";

const marketingPrimary =
  "inline-flex items-center justify-center rounded-[2px] bg-copper px-6 py-3.5 text-[14px] font-medium tracking-[0.02em] text-white transition-colors hover:bg-copper-dark";
const marketingSecondary =
  "inline-flex items-center justify-center rounded-[2px] border border-ink/20 bg-transparent px-5 py-3 text-[13px] font-medium tracking-[0.02em] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream";

const knowDemo = demos.find((item) => item.href === "/know")!;

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
        <Container className="relative pt-5 pb-4 md:pt-10 md:pb-8">
          <Eyebrow>LoopKnow</Eyebrow>
          <h1 className="mt-2 max-w-3xl text-[24px] leading-[1.12] font-medium tracking-[-0.035em] text-ink sm:text-4xl md:text-[56px] md:leading-[1.08]">
            Your knowledge already exists. Make it usable.
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-6 text-graphite md:text-[18px] md:leading-7">
            {knowDemo.description}
          </p>
          <DemoFlow steps={knowDemo.flow} className="mt-3" />
          <div className="mt-5 hidden flex-wrap items-center gap-3 sm:flex">
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

      <section ref={demoRef} id="demo" className="bg-console py-3 md:py-8">
        <div className="mx-auto w-full max-w-[1200px] px-6 lg:px-8">
          <KnowConsole />
        </div>
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

      <section className="border-t border-line bg-cream py-16 md:py-20">
        <Container>
          <h2 className="max-w-2xl text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
            Your team already has the knowledge.
          </h2>
          <p className="mt-5 max-w-2xl text-[16px] leading-7 text-graphite">
            LoopSignal organizes, connects, and makes operational knowledge
            usable across the systems and documents your team already relies on.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <TrackedLink
              href="/loopscan?source=loopknow#intake"
              location="loopknow"
              ctaText={cta.talkAboutProcess.label}
              onClick={() =>
                trackKnowLoopScanClick({ cta_text: cta.talkAboutProcess.label })
              }
              className={marketingPrimary}
            >
              {cta.talkAboutProcess.label}
            </TrackedLink>
            <TrackedLink
              href={cta.learnLoopScan.href}
              location="loopknow"
              ctaText={cta.learnLoopScan.label}
              className="text-[14px] font-medium tracking-[0.02em] text-graphite hover:text-ink"
            >
              {cta.learnLoopScan.label} →
            </TrackedLink>
          </div>
        </Container>
      </section>
    </>
  );
}
