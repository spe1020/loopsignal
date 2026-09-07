import type { Metadata } from "next";
import Link from "next/link";
import { LoopScanForm } from "@/components/LoopScanForm";
import { routePageMeta } from "@/lib/seo";
export const metadata: Metadata = routePageMeta({
  path: "/pilot",
  title: "Join the pilot",
  description:
    "Discuss a LoopSignal manufacturing software pilot. Company accounts, shared storage, and subscriptions are planned; the browser preview is available today.",
});
export default function PilotPage() {
  return (
    <section className="mx-auto grid max-w-[1120px] gap-12 px-6 py-14 md:grid-cols-2 md:gap-16 md:py-20">
      <div>
        <p className="product-eyebrow">Help shape the next LoopSignal</p>
        <h1 className="mt-5 text-4xl font-medium tracking-tight md:text-5xl">
          Bring one problem.
          <br />
          Build a better habit.
        </h1>
        <p className="mt-7 text-base leading-8 text-graphite">
          For quality, CI, procurement, and operations teams who want a clearer
          path from daily problems to verified improvements.
        </p>
        <p className="mt-5 text-sm leading-7 text-graphite">
          Join the pilot conversation to discuss your workflow. This registers
          interest; it does not create an account, book a meeting, or start a
          paid subscription.
        </p>
        <div className="mt-8 border-l-2 border-copper bg-paper p-5">
          <h2 className="text-base font-medium">
            What’s available—and what’s next
          </h2>
          <p className="mt-3 text-sm leading-7 text-graphite">
            Today: a fictional browser example and individual local tools. Next:
            private company accounts, trusted shared storage, permissions,
            recovery, and subscription access. These hosted capabilities are not
            active yet.
          </p>
        </div>
        <Link href="/workspace" className="product-link mt-8 inline-block">
          Explore the example first →
        </Link>
      </div>
      <div>
        <LoopScanForm intent="pilot" />
        <p className="mt-5 text-xs leading-6 text-graphite">
          Your contact details are sent through Formspree so we can respond.
          Share a general use case; leave confidential production records in
          your own systems.{" "}
          <Link href="/privacy" className="underline">
            Privacy details
          </Link>
        </p>
      </div>
    </section>
  );
}
