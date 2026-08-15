"use client";

import { useEffect, useRef } from "react";
import { Container, Eyebrow } from "@/components/Reveal";
import { SourceConsole } from "@/components/source/SourceConsole";
import { TrackedLink } from "@/components/TrackedLink";
import {
  trackSourceDualSourceToggle,
  trackSourceLoopScanClick,
  trackSourcePageView,
  trackSourcePriorityChange,
  trackSourceSampleRun,
  trackSourceSupplierSelect,
  trackSourceVolumeChange,
} from "@/lib/analytics";
import { defaultSettings, scenarioMeta } from "@/lib/source";
import type { OptimizationMode, SourceMode } from "@/lib/source/types";

const marketingPrimary =
  "inline-flex items-center justify-center rounded-[2px] bg-copper px-6 py-3.5 text-[14px] font-medium tracking-[0.02em] text-white transition-colors hover:bg-copper-dark";
const marketingSecondary =
  "inline-flex items-center justify-center rounded-[2px] border border-ink/20 bg-transparent px-5 py-3 text-[13px] font-medium tracking-[0.02em] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream";

export function SourceDemo() {
  const demoRef = useRef<HTMLElement>(null);
  const settingsRef = useRef(defaultSettings);

  useEffect(() => {
    trackSourcePageView();
    trackSourceSampleRun(
      scenarioMeta({
        priority: defaultSettings.priority,
        demand: defaultSettings.demand,
        sourceMode: defaultSettings.sourceMode,
      }),
    );
  }, []);

  function scrollToDemo() {
    demoRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function meta(overrides?: {
    priority?: OptimizationMode;
    demand?: number;
    sourceMode?: SourceMode;
    rank?: number;
  }) {
    const next = {
      ...settingsRef.current,
      ...overrides,
    };
    settingsRef.current = {
      ...settingsRef.current,
      priority: next.priority,
      demand: next.demand,
      sourceMode: next.sourceMode,
    };
    return scenarioMeta({
      priority: next.priority,
      demand: next.demand,
      sourceMode: next.sourceMode,
      rank: next.rank,
    });
  }

  return (
    <>
      <section className="relative overflow-hidden">
        <Container className="relative pt-12 pb-10 md:pt-16 md:pb-12">
          <Eyebrow>LoopSource</Eyebrow>
          <h1 className="mt-4 max-w-3xl text-[36px] leading-[1.08] font-medium tracking-[-0.035em] text-ink sm:text-5xl md:text-[56px]">
            Compare the quote. Understand the tradeoff.
          </h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-7 text-graphite md:text-[18px]">
            LoopSource structures sourcing decisions by connecting supplier
            quotes, commercial terms, requirements, and tradeoffs so teams can
            evaluate more than unit price.
          </p>
          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-graphite">
            Lowest price is not always lowest cost.
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
                window.dispatchEvent(new Event("loopsource:sample-rfq"));
              }}
              className={marketingSecondary}
            >
              Run Sample RFQ
            </button>
          </div>
        </Container>
      </section>

      <section ref={demoRef} id="demo" className="bg-console py-8 md:py-10">
        <div className="mx-auto w-full max-w-[1200px] px-6 lg:px-8">
          <SourceConsole
            onSampleRun={() => {
              settingsRef.current = defaultSettings;
              trackSourceSampleRun(
                scenarioMeta({
                  priority: defaultSettings.priority,
                  demand: defaultSettings.demand,
                  sourceMode: defaultSettings.sourceMode,
                }),
              );
            }}
            onSupplierSelect={(rank) =>
              trackSourceSupplierSelect(meta({ rank }))
            }
            onPriorityChange={(priority) =>
              trackSourcePriorityChange(meta({ priority }))
            }
            onVolumeChange={(demand) => trackSourceVolumeChange(meta({ demand }))}
            onDualSourceToggle={(sourceMode) =>
              trackSourceDualSourceToggle(meta({ sourceMode }))
            }
          />
        </div>
      </section>

      <section className="border-t border-line bg-cream py-16 md:py-20">
        <Container>
          <h2 className="max-w-2xl text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
            Your quote comparison is only one sourcing loop.
          </h2>
          <p className="mt-5 max-w-2xl text-[16px] leading-7 text-graphite">
            LoopSignal can help connect RFQs, supplier information,
            specifications, commercial data, and sourcing decisions into a
            workflow built around how your team actually works.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <TrackedLink
              href="/loopscan?source=loopsource"
              location="loopsource"
              ctaText="Find Your First Loop"
              onClick={() =>
                trackSourceLoopScanClick({ cta_text: "Find Your First Loop" })
              }
              className={marketingPrimary}
            >
              Find Your First Loop
            </TrackedLink>
            <TrackedLink
              href="/loopscan?source=loopsource"
              location="loopsource"
              ctaText="Start a LoopScan"
              onClick={() =>
                trackSourceLoopScanClick({ cta_text: "Start a LoopScan" })
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
