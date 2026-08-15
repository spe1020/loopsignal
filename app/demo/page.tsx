import type { Metadata } from "next";
import { DemoCards } from "@/components/DemoCards";
import { Container, Eyebrow, Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Demos",
  description:
    "See LoopWorks in action: LoopSignal for supply risk, and LoopKnow for manufacturing knowledge.",
  alternates: { canonical: "/demo" },
  openGraph: {
    title: "Demos",
    description:
      "Working examples of how LoopWorks turns existing operational information into something a team can use.",
    url: "/demo",
  },
};

export default function DemoPage() {
  return (
    <section className="py-16 md:py-24">
      <Container>
        <Reveal>
          <Eyebrow>Demos</Eyebrow>
          <h1 className="mt-5 max-w-3xl text-4xl font-medium tracking-[-0.035em] text-ink md:text-6xl">
            See LoopWorks in action.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-graphite">
            These are working examples of the LoopWorks approach — not separate
            products you have to buy. Each demo uses fictional manufacturing
            data.
          </p>
        </Reveal>
        <Reveal className="mt-12" delay={60}>
          <DemoCards />
        </Reveal>
      </Container>
    </section>
  );
}
