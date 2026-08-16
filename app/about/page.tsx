import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/Button";
import { Container, Eyebrow, Reveal } from "@/components/Reveal";
import { cta, founder } from "@/lib/content";
import { routeMeta, routePageMeta } from "@/lib/seo";

export const metadata: Metadata = routePageMeta(routeMeta.about);

const industries = [
  "Defense electronics.",
  "Fuel systems and measurement instruments.",
  "Precision machining and cutting tools.",
  "Stainless process equipment.",
  "Industrial converting.",
  "Freight and logistics.",
] as const;

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-line py-20 md:py-28">
        <Container>
          <Reveal>
            <Eyebrow>About</Eyebrow>
            <h1 className="mt-5 max-w-3xl text-4xl font-medium tracking-[-0.035em] text-ink md:text-6xl">
              I started on the bench.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-graphite">
              Building wiring harnesses and circuit boards in defense
              electronics. Seven years of it. I worked to a print and a work
              instruction, and I know exactly what it costs when the posted
              revision isn&apos;t the current one, because I built to it.
            </p>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-graphite">
              From there I was promoted to technician, then moved into
              manufacturing engineering — process, tooling, and how the product
              actually gets built. Planning and purchasing came after that.
              Since then I&apos;ve run purchasing and production control, led a
              continuous improvement program, priced freight for a
              transportation company, taught business administration to adults
              going to school at night, and now manage sourcing and supplier
              development for a manufacturer. I still do that work. This
              isn&apos;t a practice I left the floor to build.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="py-0">
        <div className="relative h-[48vh] min-h-[320px] max-h-[520px]">
          <Image
            src="/images/fabrication.jpg"
            alt="Hands-on fabrication work on the shop floor"
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-ink/25" />
        </div>
      </section>

      <section className="border-y border-line bg-paper py-24 md:py-32">
        <Container>
          <Reveal className="max-w-3xl">
            <h2 className="text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
              The industries changed. The problems didn&apos;t.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-2 md:grid-cols-3">
            {industries.map((industry, index) => (
              <Reveal
                key={industry}
                delay={index * 40}
                className="bg-cream p-7"
              >
                <p className="text-[16px] leading-7 text-ink">{industry}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-12 max-w-3xl">
            <p className="text-[16px] leading-8 text-graphite">
              Different products, different customers, different ERPs — and in
              every one of them, somebody was rebuilding the same spreadsheet
              every morning because the system that owned the data couldn&apos;t
              be trusted to produce it.
            </p>
            <p className="mt-5 text-[16px] leading-8 text-graphite">
              That repetition is why LoopSignal exists. After enough plants you
              stop seeing unique problems and start seeing the same handful
              wearing different clothes: information living in one person&apos;s
              inbox, a report rebuilt instead of trusted, a handoff that only
              works because someone walks it down the hall, a decision waiting
              on the one person who knows.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="py-24 md:py-32">
        <Container className="grid items-start gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src="/images/gemba.jpg"
                alt="A manufacturing technician inspecting equipment on the shop floor"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 33vw, 100vw"
              />
              <div className="absolute inset-0 bg-ink/55" />
              <div className="absolute inset-0 flex flex-col justify-end p-7 text-cream">
                <p className="font-mono text-[11px] tracking-[0.18em] text-copper">
                  SS
                </p>
                <p className="mt-4 text-2xl font-medium tracking-tight">
                  {founder.name}
                </p>
                <p className="mt-1 text-sm text-white/70">{founder.role}</p>
              </div>
            </div>
          </Reveal>
          <Reveal className="lg:col-span-8" delay={80}>
            <h2 className="text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
              What the bench taught me that the office didn&apos;t
            </h2>
            <p className="mt-6 text-[16px] leading-8 text-graphite">
              I&apos;ve been on the receiving end of process improvement. I
              know what it&apos;s like when someone shows up with a clipboard,
              watches you work for an hour, and writes a report about a job
              they&apos;ve never done. I know which questions are worth
              answering and which ones tell you the person asking has already
              decided.
            </p>
            <p className="mt-4 text-[16px] leading-8 text-graphite">
              I also learned how the product gets built before I was
              responsible for buying the parts. That&apos;s backwards from how
              most supply chain people come up, and it changes what a late
              order looks like. A shortage isn&apos;t a row on a report.
              It&apos;s a specific operation that can&apos;t run, on a specific
              machine, with people standing at it.
            </p>
            <p className="mt-4 text-[16px] leading-8 text-graphite">
              That&apos;s most of why I start by watching the work instead of
              asking for the process documentation. The documentation describes
              the process someone designed. The floor tells you the one that
              actually runs — including the workarounds people built because
              the designed one didn&apos;t survive contact with a real order.
            </p>
            <a
              href={founder.linkedin}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex text-[13px] font-medium text-copper hover:text-copper-dark"
            >
              LinkedIn →
            </a>
          </Reveal>
        </Container>
      </section>

      <section className="border-y border-line bg-paper py-24 md:py-32">
        <Container className="max-w-3xl">
          <Reveal>
            <h2 className="text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
              How I work
            </h2>
            <p className="mt-6 text-[16px] leading-8 text-graphite">
              Most of what slows a plant down isn&apos;t a technology gap.
              It&apos;s a process that grew around a limitation nobody
              remembers anymore. I&apos;ve watched expensive systems get
              installed on top of that and change nothing, because the software
              automated the workaround instead of removing the reason for it.
            </p>
            <p className="mt-4 text-[16px] leading-8 text-graphite">
              So I start with the work. Sometimes the answer is a process
              change and no technology at all. Sometimes it&apos;s connecting
              two systems that already hold what you need. Sometimes it&apos;s
              automation, or software built to your specification. Usually
              it&apos;s a combination, in that order.
            </p>
            <p className="mt-8 text-[16px] leading-8 text-graphite">
              I also build. I&apos;ve shipped a consumer platform across web,
              Android, and iOS — product, payments, AI, the whole stack. When
              something genuinely needs to be built, I can build it. That&apos;s
              not the starting assumption.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="py-24 md:py-32">
        <Container className="grid items-center gap-12 lg:grid-cols-12">
          <Reveal className="relative aspect-[4/5] overflow-hidden lg:col-span-5">
            <Image
              src="/images/assembly.jpg"
              alt="An engineer working with production information at an assembly station"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
          </Reveal>
          <Reveal className="lg:col-span-7" delay={80}>
            <h2 className="text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
              Outside the plant
            </h2>
            <p className="mt-6 text-[16px] leading-8 text-graphite">
              I chair the policy committee for our school board and serve on
              our municipal water authority. Both are unglamorous, and both are
              the same skill this work needs: getting people who don&apos;t
              report to you, don&apos;t agree with each other, and have other
              jobs to settle on a process and then actually follow it.
            </p>
            <p className="mt-4 text-[16px] leading-8 text-graphite">
              That&apos;s where improvement projects fail. The analysis is
              rarely the hard part. Getting a change to hold after the
              consultant leaves is.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="border-y border-line bg-paper py-24 md:py-32">
        <Container className="max-w-3xl">
          <Reveal>
            <h2 className="text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
              The honest part
            </h2>
            <p className="mt-6 text-[16px] leading-8 text-graphite">
              LoopSignal is new. I&apos;ve done this work for two decades
              inside companies; I haven&apos;t yet done it as an outside
              engagement. That&apos;s why LoopScan is a fixed price with a
              defined deliverable and an unconditional guarantee — the risk of
              being early should sit with me, not with you.
            </p>
            <p className="mt-4 text-[16px] leading-8 text-graphite">
              Based in central Pennsylvania. I&apos;ve spent my career in
              plants that look like yours.
            </p>
            <div className="mt-10">
              <Button href={cta.talkAboutProcess.href} location="about">
                {cta.talkAboutProcess.label}
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
