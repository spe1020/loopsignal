"use client";

import { useEffect, useRef, useState } from "react";
import { DemoFlow } from "@/components/DemoCards";
import { Container, Eyebrow } from "@/components/Reveal";
import { SampleDataCaption } from "@/components/SampleDataCaption";
import { SignalResults } from "@/components/signal/SignalResults";
import { TrackedLink } from "@/components/TrackedLink";
import {
  trackSignalAnalysisError,
  trackSignalAnalysisSuccess,
  trackSignalLoopScanClick,
  trackSignalPageView,
  trackSignalSampleRun,
  type SignalErrorCategory,
} from "@/lib/analytics";
import { cta, demos, loopScanOffer } from "@/lib/content";
import { analyzeSample } from "@/lib/signal";
import { formatIsoDate } from "@/lib/signal/dates";
import type { SignalAnalysisResult } from "@/lib/signal/types";

const marketingPrimary =
  "inline-flex items-center justify-center rounded-[2px] bg-copper px-6 py-3.5 text-[14px] font-medium tracking-[0.02em] text-white transition-colors hover:bg-copper-dark disabled:cursor-not-allowed disabled:opacity-70";
const marketingSecondary =
  "inline-flex items-center justify-center rounded-[2px] border border-ink/20 bg-transparent px-5 py-3 text-[13px] font-medium tracking-[0.02em] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream disabled:cursor-not-allowed disabled:opacity-70";
const consoleBtn =
  "inline-flex min-h-9 items-center justify-center border border-[#c8c8c0] bg-white px-3 py-1.5 text-[12px] font-medium text-ink hover:border-ink disabled:cursor-not-allowed disabled:opacity-60";
const consoleBtnSolid =
  "inline-flex min-h-9 items-center justify-center border border-ink bg-ink px-3 py-1.5 text-[12px] font-medium text-white hover:bg-graphite disabled:cursor-not-allowed disabled:opacity-60";

const sampleResult = analyzeSample();
const supplyDemo = demos.find((item) => item.href === "/supply")!;

function classifyError(message: string, network: boolean): SignalErrorCategory {
  if (network) return "network";
  const lower = message.toLowerCase();
  if (
    lower.includes("couldn't read this report") ||
    lower.includes("csv") ||
    lower.includes("excel")
  ) {
    return "validation";
  }
  if (
    lower.includes("couldn't read the rows") ||
    lower.includes("did not contain")
  ) {
    return "parse";
  }
  return "server";
}

async function readError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: unknown };
    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }
  } catch {
    /* use fallback */
  }
  return "We couldn't analyze this report just now. Please try again.";
}

export function SignalDemo() {
  const [result, setResult] = useState<SignalAnalysisResult | null>(
    sampleResult,
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const demoRef = useRef<HTMLElement>(null);

  useEffect(() => {
    trackSignalPageView();
  }, []);

  function showError(message: string, network = false) {
    setError(message);
    setResult(null);
    trackSignalAnalysisError(classifyError(message, network));
  }

  async function runSample() {
    setLoading(true);
    setError("");

    try {
      trackSignalSampleRun();
      const response = await fetch("/api/signal/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "sample" }),
      });

      if (!response.ok) {
        showError(await readError(response));
        return;
      }

      const payload = (await response.json()) as SignalAnalysisResult;
      if (!payload?.ok || !Array.isArray(payload.orders)) {
        showError("We couldn't analyze this report just now. Please try again.");
        return;
      }

      setResult(payload);
      trackSignalAnalysisSuccess({
        source: payload.meta.source,
        row_count_bucket: payload.meta.rowCountBucket,
        inventory_fields: payload.meta.hasInventoryFields,
      });
    } catch {
      showError(
        "We couldn't analyze this report just now. Please try again.",
        true,
      );
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(sampleResult);
    setError("");
  }

  return (
    <>
      <section className="relative overflow-hidden">
        <Container className="relative pt-5 pb-4 md:pt-10 md:pb-8">
          <Eyebrow>LoopSupply</Eyebrow>
          <h1 className="mt-2 max-w-3xl text-[24px] leading-[1.12] font-medium tracking-[-0.035em] text-ink sm:text-4xl md:text-[56px] md:leading-[1.08]">
            Stop searching the report. Find what needs attention.
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-6 text-graphite md:text-[18px] md:leading-7">
            {supplyDemo.description}
          </p>
          <DemoFlow steps={supplyDemo.flow} className="mt-3" />
          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-graphite">
            This is a sample dataset. Running it against your open POs is what
            a LoopScan is. The complete sample LoopScan on this same fictional
            Northfield file is six pages.{" "}
            <a
              href={loopScanOffer.samplePdf.href}
              download={loopScanOffer.samplePdf.filename}
              className="font-medium text-copper hover:text-copper-dark"
            >
              {loopScanOffer.samplePdf.cta} →
            </a>
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              href="#demo"
              onClick={(event) => {
                event.preventDefault();
                demoRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
              className={marketingPrimary}
            >
              Open the Console
            </a>
            <button
              type="button"
              onClick={() => {
                demoRef.current?.scrollIntoView({ behavior: "smooth" });
                void runSample();
              }}
              disabled={loading}
              className={marketingSecondary}
            >
              {loading ? "Reading the report…" : "Run Sample Data"}
            </button>
          </div>
        </Container>
      </section>

      <section ref={demoRef} id="demo" className="bg-console py-3 md:py-8">
        <Container>
          <div className="border border-[#c8c8c0] bg-console-surface">
            <header className="sticky top-[72px] z-20 flex flex-col gap-3 border-b border-[#c8c8c0] bg-console-surface/95 px-4 py-3 backdrop-blur-md md:flex-row md:items-center md:justify-between md:px-5">
              <div>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <p className="text-[15px] font-medium tracking-tight text-ink">
                    LoopSupply
                  </p>
                  <p className="text-[12px] text-graphite">
                    Supply Risk Console
                  </p>
                </div>
                <p className="mt-1 font-mono text-[10px] tracking-[0.08em] text-stone">
                  DEMO · FICTIONAL SAMPLE DATA
                  {result
                    ? ` · Updated ${formatIsoDate(result.meta.asOfDate)}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void runSample()}
                  disabled={loading}
                  className={consoleBtnSolid}
                >
                  {loading ? "Reading…" : "Run Sample Data"}
                </button>
                <button type="button" onClick={reset} className={consoleBtn}>
                  Reset Demo
                </button>
              </div>
            </header>

            {result ? (
              <div>
                <SampleDataCaption className="border-b border-[#d9d9d2] bg-[#fafaf7] px-4 py-2 md:px-5" />
                <SignalResults result={result} />
              </div>
            ) : (
              <div className="px-4 py-6 md:px-5 md:py-8">
                <p className="text-[15px] leading-7 text-graphite">
                  This is a sample dataset. Running it against your open POs is
                  what a LoopScan is.
                </p>
                {error ? (
                  <p
                    role="alert"
                    className="mt-4 border border-risk-critical bg-risk-critical-bg px-4 py-3 text-sm leading-6 text-ink"
                  >
                    {error}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </Container>
      </section>

      <section className="border-t border-line bg-cream py-16 md:py-20">
        <Container>
          <h2 className="max-w-2xl text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
            This report started with a CSV.
          </h2>
          <p className="mt-5 max-w-2xl text-[16px] leading-7 text-graphite">
            This is a sample dataset. Running it against your open POs is what
            a LoopScan is. The six-page sample LoopScan is built on this same
            fictional Northfield file.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <TrackedLink
              href="/loopscan?source=loopsupply#intake"
              location="loopsupply"
              ctaText={cta.talkAboutProcess.label}
              onClick={() =>
                trackSignalLoopScanClick({
                  cta_text: cta.talkAboutProcess.label,
                })
              }
              className={marketingPrimary}
            >
              {cta.talkAboutProcess.label}
            </TrackedLink>
            <a
              href={loopScanOffer.samplePdf.href}
              download={loopScanOffer.samplePdf.filename}
              className="text-[14px] font-medium tracking-[0.02em] text-graphite hover:text-ink"
            >
              {loopScanOffer.samplePdf.cta} →
            </a>
            <TrackedLink
              href={cta.learnLoopScan.href}
              location="loopsupply"
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
