"use client";

import { useEffect, useRef, useState } from "react";
import { Container, Eyebrow } from "@/components/Reveal";
import { SignalResults } from "@/components/signal/SignalResults";
import { TrackedLink } from "@/components/TrackedLink";
import {
  trackSignalAnalysisError,
  trackSignalAnalysisSuccess,
  trackSignalLoopScanClick,
  trackSignalPageView,
  trackSignalSampleRun,
  trackSignalUploadStart,
  type SignalErrorCategory,
} from "@/lib/analytics";
import { formatIsoDate } from "@/lib/signal/dates";
import { SIGNAL_LIMITS, type SignalAnalysisResult } from "@/lib/signal/types";

const marketingPrimary =
  "inline-flex items-center justify-center rounded-[2px] bg-copper px-6 py-3.5 text-[14px] font-medium tracking-[0.02em] text-white transition-colors hover:bg-copper-dark disabled:cursor-not-allowed disabled:opacity-70";
const marketingSecondary =
  "inline-flex items-center justify-center rounded-[2px] border border-ink/20 bg-transparent px-5 py-3 text-[13px] font-medium tracking-[0.02em] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream disabled:cursor-not-allowed disabled:opacity-70";
const consoleBtn =
  "inline-flex min-h-9 items-center justify-center border border-[#c8c8c0] bg-white px-3 py-1.5 text-[12px] font-medium text-ink hover:border-ink disabled:cursor-not-allowed disabled:opacity-60";
const consoleBtnSolid =
  "inline-flex min-h-9 items-center justify-center border border-ink bg-ink px-3 py-1.5 text-[12px] font-medium text-white hover:bg-graphite disabled:cursor-not-allowed disabled:opacity-60";

function classifyError(message: string, network: boolean): SignalErrorCategory {
  if (network) return "network";
  const lower = message.toLowerCase();
  if (lower.includes("too large")) return "size";
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
  const [result, setResult] = useState<SignalAnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const demoRef = useRef<HTMLElement>(null);

  useEffect(() => {
    trackSignalPageView();
  }, []);

  function showError(message: string, network = false) {
    setError(message);
    setResult(null);
    trackSignalAnalysisError(classifyError(message, network));
  }

  async function runAnalysis(input: { source: "sample" } | { file: File }) {
    setLoading(true);
    setError("");

    try {
      let response: Response;
      if ("source" in input) {
        trackSignalSampleRun();
        response = await fetch("/api/signal/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: "sample" }),
        });
      } else {
        const body = new FormData();
        body.append("file", input.file);
        response = await fetch("/api/signal/analyze", {
          method: "POST",
          body,
        });
      }

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

  function onFile(file: File | undefined) {
    if (!file || loading) return;
    trackSignalUploadStart();
    if (file.size > SIGNAL_LIMITS.maxFileBytes) {
      showError(
        "This file is too large for the demo. Please upload a CSV under 1 MB.",
      );
      return;
    }
    const name = file.name.toLowerCase();
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      showError(
        "Please upload a CSV file. Excel workbooks are not supported in this demo.",
      );
      return;
    }
    void runAnalysis({ file });
  }

  function reset() {
    setResult(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const sampleLabel =
    result?.meta.source === "sample"
      ? "FICTIONAL SAMPLE DATA"
      : result
        ? "UPLOADED CSV"
        : "DEMO";

  return (
    <>
      <section className="relative overflow-hidden">
        <Container className="relative pt-12 pb-10 md:pt-16 md:pb-12">
          <Eyebrow>LoopSupply</Eyebrow>
          <h1 className="mt-4 max-w-3xl text-[36px] leading-[1.08] font-medium tracking-[-0.035em] text-ink sm:text-5xl md:text-[56px]">
            Stop searching the report. Find what needs attention.
          </h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-7 text-graphite md:text-[18px]">
            LoopSupply turns an open purchase-order report into a prioritized
            view of supplier and material risk so buyers can focus on the
            orders that actually need action.
          </p>
          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-graphite">
            No ERP integration required for this demo. Upload a CSV and see the
            signal inside the noise.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
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
                void runAnalysis({ source: "sample" });
              }}
              disabled={loading}
              className={marketingSecondary}
            >
              {loading && !result ? "Reading the report…" : "Run Sample Data"}
            </button>
          </div>
        </Container>
      </section>

      <section ref={demoRef} id="demo" className="bg-console py-8 md:py-10">
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
                  DEMO · {sampleLabel}
                  {result
                    ? ` · Updated ${formatIsoDate(result.meta.asOfDate)}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={loading}
                  className={consoleBtn}
                >
                  Upload CSV
                </button>
                <button
                  type="button"
                  onClick={() => void runAnalysis({ source: "sample" })}
                  disabled={loading}
                  className={consoleBtnSolid}
                >
                  {loading ? "Reading…" : "Run Sample Data"}
                </button>
                {result ? (
                  <button
                    type="button"
                    onClick={reset}
                    className={consoleBtn}
                  >
                    Reset Demo
                  </button>
                ) : (
                  <a href="/api/signal/sample" className={consoleBtn}>
                    Download Sample CSV
                  </a>
                )}
              </div>
            </header>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="sr-only"
              onChange={(event) => {
                onFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />

            {result ? (
              <SignalResults result={result} />
            ) : (
              <div className="px-4 py-6 md:px-5 md:py-8">
                <aside className="border border-[#d9d9d2] bg-white px-4 py-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
                    Demo environment
                  </p>
                  <p className="mt-2 text-sm leading-6 text-graphite">
                    LoopSupply is an early demonstration of the LoopSignal
                    approach and is not intended to replace production planning,
                    ERP, MRP, or purchasing systems.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-graphite">
                    Do not upload confidential, proprietary, export-controlled,
                    personal, or sensitive company information to this public
                    demo. Use the provided sample file or sanitized data.
                  </p>
                </aside>

                <div
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    onFile(event.dataTransfer.files[0]);
                  }}
                  className={`mt-4 border border-dashed px-4 py-10 text-center ${
                    dragging
                      ? "border-ink bg-white"
                      : "border-[#c8c8c0] bg-white"
                  }`}
                >
                  <p className="text-[15px] font-medium text-ink">
                    Drop a CSV here, or choose a file
                  </p>
                  <p className="mt-2 text-sm text-stone">
                    CSV only · 1 MB limit · processed in memory, then discarded
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      disabled={loading}
                      className={consoleBtnSolid}
                    >
                      {loading ? "Reading the report…" : "Upload CSV"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void runAnalysis({ source: "sample" })}
                      disabled={loading}
                      className={consoleBtn}
                    >
                      Run Sample Data
                    </button>
                  </div>
                </div>

                {error ? (
                  <p
                    role="alert"
                    className="mt-4 border border-risk-critical bg-risk-critical-bg px-4 py-3 text-sm leading-6 text-ink"
                  >
                    {error}{" "}
                    <a
                      href="/api/signal/sample"
                      className="font-medium underline"
                    >
                      Download the sample template
                    </a>
                    .
                  </p>
                ) : null}

                <div className="mt-6 grid gap-6 border-t border-[#d9d9d2] pt-5 md:grid-cols-2">
                  <p className="text-[13px] leading-6 text-graphite">
                    <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
                      Expected columns
                    </span>
                    <span className="mt-2 block">
                      Required: PO number, supplier, due date, quantity ordered,
                      quantity received. Optional: item, description, promised
                      date, buyer, inventory on hand, daily usage, unit cost.
                    </span>
                  </p>
                  <p className="text-[13px] leading-6 text-graphite">
                    <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-stone">
                      How orders are flagged
                    </span>
                    <span className="mt-2 block">
                      Open quantity, days past the promised or due date, missing
                      confirmations, inventory coverage, and open value when
                      those fields are present. No AI is used in this version.
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </Container>
      </section>

      {result ? (
        <section className="border-t border-line bg-cream py-16 md:py-20">
          <Container>
            <h2 className="max-w-2xl text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
              This report started with a CSV.
            </h2>
            <p className="mt-5 max-w-2xl text-[16px] leading-7 text-graphite">
              LoopSignal can help connect this kind of decision support to the
              systems, information, and workflows your team already uses.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <TrackedLink
                href="/loopscan?source=loopsupply"
                location="loopsupply"
                ctaText="Find Your First Loop"
                onClick={() =>
                  trackSignalLoopScanClick({ cta_text: "Find Your First Loop" })
                }
                className={marketingPrimary}
              >
                Find Your First Loop
              </TrackedLink>
              <TrackedLink
                href="/loopscan?source=loopsupply"
                location="loopsupply"
                ctaText="Start a LoopScan"
                onClick={() =>
                  trackSignalLoopScanClick({ cta_text: "Start a LoopScan" })
                }
                className="text-[14px] font-medium tracking-[0.02em] text-graphite hover:text-ink"
              >
                Start a LoopScan →
              </TrackedLink>
            </div>
          </Container>
        </section>
      ) : (
        <section className="py-12 md:py-16">
          <Container>
            <p className="max-w-2xl text-[15px] leading-7 text-graphite">
              LoopSupply demonstrates what’s possible. LoopScan finds where it
              creates value in your operation.
            </p>
          </Container>
        </section>
      )}
    </>
  );
}
