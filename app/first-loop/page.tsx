import type { Metadata } from "next";
import { IntakeForm } from "@/components/IntakeForm";
import { Container, Eyebrow } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Start a LoopScan",
  description:
    "Tell us about one process that takes too long, depends on scattered information, or causes recurring problems.",
};

export default function FirstLoopPage() {
  return (
    <section className="py-20 md:py-28">
      <Container className="grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Eyebrow>Start a LoopScan</Eyebrow>
          <h1 className="mt-5 text-4xl font-medium tracking-[-0.035em] text-ink md:text-5xl">
            Show us the process.
          </h1>
          <p className="mt-6 text-[16px] leading-8 text-graphite">
            Tell us about a process that takes too long, requires too much
            manual work, depends on scattered information, or repeatedly causes
            problems.
          </p>
          <p className="mt-4 text-[16px] leading-8 text-graphite">
            We’ll review it and follow up. LoopScan is a practical first step —
            no major technology commitment required.
          </p>
        </div>
        <div className="lg:col-span-7">
          <IntakeForm />
        </div>
      </Container>
    </section>
  );
}
