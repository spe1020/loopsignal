"use client";

import Link from "next/link";
import { LoopGlyph } from "@/components/loop/icons";
import { MapProvider } from "./MapProvider";

export function FlowShell({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <MapProvider
      id={id}
      fallback={
        <div className="loop-root flex min-h-[60vh] items-center justify-center" aria-busy="true">
          <div className="flex items-center gap-3 text-[14px] text-stone">
            <LoopGlyph animated className="h-6 w-12" />
            Opening map…
          </div>
        </div>
      }
      missing={
        <div className="loop-root flex min-h-[60vh] items-center justify-center px-6">
          <div className="max-w-md text-center">
            <LoopGlyph className="mx-auto h-8 w-16" />
            <h1 className="mt-5 text-2xl font-medium tracking-tight text-ink">Map not found</h1>
            <p className="mt-3 text-[15px] leading-7 text-graphite">
              LoopFlow stores process maps locally in this browser. This one is not here — it may have been deleted, or
              created on another device.
            </p>
            <Link href="/flow" className="mt-6 inline-flex min-h-[44px] items-center rounded-[3px] bg-ink px-5 text-[14px] font-medium text-cream focus-visible:outline-2 focus-visible:outline-copper">
              Back to LoopFlow
            </Link>
          </div>
        </div>
      }
    >
      {children}
    </MapProvider>
  );
}
