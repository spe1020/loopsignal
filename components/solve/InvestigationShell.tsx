"use client";

import Link from "next/link";
import { InvestigationProvider } from "./InvestigationProvider";
import { LoopGlyph } from "./icons";

export function InvestigationShell({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <InvestigationProvider
      id={id}
      fallback={
        <div className="solve-root flex min-h-[60vh] items-center justify-center" aria-busy="true">
          <div className="flex items-center gap-3 text-[14px] text-stone">
            <LoopGlyph animated className="h-6 w-12" />
            Opening investigation…
          </div>
        </div>
      }
      missing={
        <div className="solve-root flex min-h-[60vh] items-center justify-center px-6">
          <div className="max-w-md text-center">
            <LoopGlyph className="mx-auto h-8 w-16" />
            <h1 className="mt-5 text-2xl font-medium tracking-tight text-ink">Investigation not found</h1>
            <p className="mt-3 text-[15px] leading-7 text-graphite">
              LoopSolve stores investigations locally in this browser. This one is not here — it may have been
              deleted, or created on another device.
            </p>
            <Link
              href="/solve"
              className="mt-6 inline-flex min-h-[44px] items-center rounded-[3px] bg-ink px-5 text-[14px] font-medium text-cream focus-visible:outline-2 focus-visible:outline-copper"
            >
              Back to LoopSolve
            </Link>
          </div>
        </div>
      }
    >
      {children}
    </InvestigationProvider>
  );
}
