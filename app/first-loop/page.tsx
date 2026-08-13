import type { Metadata } from "next";
import { IntakeForm } from "@/components/IntakeForm";
import { Container, Eyebrow } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Find Your First Loop",
  description:
    "Tell us about one process that takes too long, depends on scattered information, or causes recurring problems.",
};

export default function FirstLoopPage() {
  return (
    <section className="py-20 md:py-28">
      <Container className="grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Eyebrow>Find your first loop</Eyebrow>
          <h1 className="mt-5 text-4xl font-medium tracking-[-0.035em] text-ink md:text-5xl">
            Show us the process.
          </h1>
          <p className="mt-6 text-[16px] leading-8 text-graphite">
            Buyers shouldn’t spend Friday afternoon chasing overdue purchase
            orders. Planners shouldn’t rebuild the same report every morning.
            Quality teams shouldn’t search for years to find one corrective
            action.
          </p>
          <p className="mt-4 text-[16px] leading-8 text-graphite">
            Tell us about one painful or inefficient process. We’ll review it
            and follow up to learn more.
          </p>
        </div>
        <div className="lg:col-span-7">
          <IntakeForm />
        </div>
      </Container>
    </section>
  );
}
