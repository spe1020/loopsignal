"use client";

import { useCallback, useEffect, useRef } from "react";
import { BriefConsole } from "@/components/brief/BriefConsole";
import { Container, Eyebrow } from "@/components/Reveal";
import { TrackedLink } from "@/components/TrackedLink";
import { cta } from "@/lib/content";
import {
  trackBriefActionSelect,
  trackBriefActionStatusChange,
  trackBriefAssign,
  trackBriefBotRun,
  trackBriefCategoryFilter,
  trackBriefCopy,
  trackBriefEmailPreview,
  trackBriefIssueSelect,
  trackBriefLoopScanClick,
  trackBriefMeetingMode,
  trackBriefOutcome,
  trackBriefOwnerFilter,
  trackBriefPageView,
  trackBriefPersonaView,
  trackBriefReportCopy,
  trackBriefReportView,
  trackBriefRun,
} from "@/lib/analytics";
import { SAMPLE_SCENARIO } from "@/lib/brief";

const marketingPrimary =
  "inline-flex items-center justify-center rounded-[2px] bg-copper px-6 py-3.5 text-[14px] font-medium tracking-[0.02em] text-white transition-colors hover:bg-copper-dark";
const marketingSecondary =
  "inline-flex items-center justify-center rounded-[2px] border border-ink/20 bg-transparent px-5 py-3 text-[13px] font-medium tracking-[0.02em] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream";

export function BriefDemo() {
  const demoRef = useRef<HTMLElement>(null);

  useEffect(() => {
    trackBriefPageView();
  }, []);

  function scrollToDemo() {
    demoRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function meta() {
    return { sample_scenario: SAMPLE_SCENARIO };
  }

  const onRun = useCallback(() => trackBriefRun(meta()), []);
  const onCategoryFilter = useCallback((category: string) => {
    trackBriefCategoryFilter({ ...meta(), category });
  }, []);
  const onOwnerFilter = useCallback((owner: string) => {
    trackBriefOwnerFilter({ ...meta(), owner });
  }, []);
  const onIssueSelect = useCallback(
    (input: { category: string; severity: string }) => {
      trackBriefIssueSelect({
        ...meta(),
        category: input.category,
        severity: input.severity,
      });
    },
    [],
  );
  const onMeetingMode = useCallback((on: boolean) => {
    trackBriefMeetingMode({ ...meta(), meeting_mode: on });
  }, []);
  const onActionStatusChange = useCallback(
    (input: { timing: string; owner: string }) => {
      trackBriefActionStatusChange({
        ...meta(),
        action_timing: input.timing,
        owner: input.owner,
      });
    },
    [],
  );
  const onCopy = useCallback(() => trackBriefCopy(meta()), []);
  const onReportView = useCallback((kind: string) => {
    trackBriefReportView({ ...meta(), report_kind: kind });
  }, []);
  const onReportCopy = useCallback((kind: string) => {
    trackBriefReportCopy({ ...meta(), report_kind: kind });
  }, []);
  const onEmailPreview = useCallback(() => trackBriefEmailPreview(meta()), []);
  const onPersonaView = useCallback((persona: string) => {
    trackBriefPersonaView({ ...meta(), persona });
  }, []);
  const onAssign = useCallback((input: { owner_type: string; bot_type?: string }) => {
    trackBriefAssign({
      ...meta(),
      owner_type: input.owner_type,
      bot_type: input.bot_type,
    });
  }, []);
  const onBotRun = useCallback((bot_type: string) => {
    trackBriefBotRun({ ...meta(), bot_type });
  }, []);
  const onActionSelect = useCallback((category: string) => {
    trackBriefActionSelect({ ...meta(), category });
  }, []);
  const onOutcome = useCallback((outcome: string) => {
    trackBriefOutcome({ ...meta(), outcome });
  }, []);

  return (
    <>
      <section className="relative overflow-hidden">
        <Container className="relative pt-12 pb-10 md:pt-16 md:pb-12">
          <Eyebrow>LoopBrief</Eyebrow>
          <h1 className="mt-4 max-w-3xl text-[36px] leading-[1.08] font-medium tracking-[-0.035em] text-ink sm:text-5xl md:text-[56px]">
            Start the day with what matters.
          </h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-7 text-graphite md:text-[18px]">
            LoopBrief turns daily operational information into priorities,
            ownership, reporting, and action.
          </p>
          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-graphite">
            Less time assembling the meeting. More time solving the problems.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#demo"
              onClick={(event) => {
                event.preventDefault();
                scrollToDemo();
                window.dispatchEvent(new Event("loopbrief:run"));
              }}
              className={marketingPrimary}
            >
              Run Today&apos;s Brief
            </a>
            <button
              type="button"
              onClick={() => {
                scrollToDemo();
                window.dispatchEvent(new Event("loopbrief:sample"));
              }}
              className={marketingSecondary}
            >
              Use Sample Data
            </button>
          </div>
        </Container>
      </section>

      <section ref={demoRef} id="demo" className="bg-console py-8 md:py-10">
        <div className="mx-auto w-full max-w-[1200px] px-6 lg:px-8">
          <BriefConsole
            onRun={onRun}
            onCategoryFilter={onCategoryFilter}
            onOwnerFilter={onOwnerFilter}
            onIssueSelect={onIssueSelect}
            onMeetingMode={onMeetingMode}
            onActionStatusChange={onActionStatusChange}
            onCopy={onCopy}
            onReportView={onReportView}
            onReportCopy={onReportCopy}
            onEmailPreview={onEmailPreview}
            onPersonaView={onPersonaView}
            onAssign={onAssign}
            onBotRun={onBotRun}
            onActionSelect={onActionSelect}
            onOutcome={onOutcome}
          />
        </div>
      </section>

      <section className="border-t border-line bg-cream py-16 md:py-20">
        <Container>
          <h2 className="max-w-2xl text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
            Your daily meeting already has the data.
          </h2>
          <p className="mt-5 max-w-2xl text-[16px] leading-7 text-graphite">
            LoopSignal connects production, quality, supply, maintenance,
            and planning information into a daily operating system built around
            exceptions and action.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <TrackedLink
              href="/loopscan?source=loopbrief#intake"
              location="loopbrief"
              ctaText={cta.talkAboutProcess.label}
              onClick={() =>
                trackBriefLoopScanClick({ cta_text: cta.talkAboutProcess.label })
              }
              className={marketingPrimary}
            >
              {cta.talkAboutProcess.label}
            </TrackedLink>
            <TrackedLink
              href={cta.learnLoopScan.href}
              location="loopbrief"
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
