import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/Button";
import { ProcessLoop } from "@/components/Loops";
import { Container, Eyebrow, Reveal } from "@/components/Reveal";
import { howItWorks, implementationSequence } from "@/lib/content";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "See, simplify, connect, automate, measure, improve. LoopSignal starts with the work, then improves the process and connects the right systems around it.",
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    title: "How It Works",
    description:
      "See, simplify, connect, automate, measure, improve. LoopSignal starts with the work, then improves the process and connects the right systems around it.",
    url: "/how-it-works",
  },
};

export default function HowItWorksPage() {
  return (
    <>
      <section className="border-b border-line py-20 md:py-28">
        <Container>
          <Reveal>
            <Eyebrow>How it works</Eyebrow>
            <h1 className="mt-5 max-w-3xl text-4xl font-medium tracking-[-0.035em] text-ink md:text-6xl">
              See the work. Improve the process. Connect what is needed. Repeat.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-graphite">
              We do not start with a tool. We start with the work — how it
              actually operates, where it stalls, and what would make it
              clearer. Continuous improvement is built into the process.
            </p>
          </Reveal>
          <Reveal className="mt-14" delay={100}>
            <ProcessLoop />
          </Reveal>
        </Container>
      </section>

      {howItWorks.map((step, index) => (
        <section
          key={step.name}
          className={index % 2 === 1 ? "bg-paper" : "bg-cream"}
        >
          <Container className="grid gap-12 py-20 lg:grid-cols-12 md:py-28">
            <Reveal className="lg:col-span-5">
              <p className="font-mono text-[11px] tracking-[0.18em] text-copper">
                {step.step}
              </p>
              <h2 className="mt-4 text-4xl font-medium tracking-[-0.03em] text-ink md:text-5xl">
                {step.name}
              </h2>
              <p className="mt-6 text-[17px] leading-8 text-graphite">
                {step.summary}
              </p>
            </Reveal>
            <Reveal className="lg:col-span-7" delay={80}>
              <ul className="grid gap-px border border-line bg-line sm:grid-cols-2">
                {step.points.map((point) => (
                  <li
                    key={point}
                    className="bg-cream px-5 py-5 text-[15px] text-ink"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            </Reveal>
          </Container>
        </section>
      ))}

      <section className="border-y border-line bg-paper py-20 md:py-28">
        <Container>
          <Reveal>
            <Eyebrow>Implementation</Eyebrow>
            <h2 className="mt-5 max-w-2xl text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
              A practical sequence for the first loop.
            </h2>
            <p className="mt-5 max-w-2xl text-[16px] leading-7 text-graphite">
              See, simplify, connect, automate, measure, and improve is how we
              think. This is how the first implementation actually runs.
            </p>
          </Reveal>
          <ol className="mt-12 grid gap-px border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
            {implementationSequence.map((item, index) => (
              <Reveal
                key={item.name}
                delay={index * 40}
                className="bg-cream p-7 md:p-8"
              >
                <p className="font-mono text-[11px] tracking-[0.16em] text-copper">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 text-xl font-medium tracking-tight text-ink">
                  {item.name}
                </h3>
                <p className="mt-3 text-[15px] leading-7 text-graphite">
                  {item.summary}
                </p>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      <section className="py-20 md:py-28">
        <Container className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <Eyebrow>Ownership</Eyebrow>
            <h2 className="mt-5 text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
              Put the right work with the right owner.
            </h2>
          </Reveal>
          <Reveal className="lg:col-span-7" delay={80}>
            <p className="text-[16px] leading-8 text-graphite">
              Some work requires experience and judgment. Some work is
              repetitive, rules-based, or information-heavy. LoopSignal helps
              define the difference.
            </p>
            <p className="mt-5 text-[16px] leading-8 text-graphite">
              The solution may route work to people, automated workflows,
              software, or intelligent agents while keeping human control where
              decisions carry meaningful risk.
            </p>
            <p className="mt-8 font-serif text-2xl leading-snug text-ink">
              Technology should support judgment, not replace it blindly.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="relative overflow-hidden">
        <div className="relative h-[420px]">
          <Image
            src="/images/plant-hall.jpg"
            alt="Industrial plant hall with overhead cranes and marked floor lanes"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-ink/55" />
          <Container className="relative flex h-full flex-col justify-end pb-12">
            <p className="max-w-xl text-xl leading-8 text-cream md:text-2xl">
              The loop does not end at launch. Measure the impact. Identify the
              next constraint. Improve again.
            </p>
            <div className="mt-8">
              <Button href="/loopscan" variant="dark" location="how_it_works">
                Find Your First Loop
              </Button>
            </div>
          </Container>
        </div>
      </section>
    </>
  );
}
