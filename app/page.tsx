import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/Button";
import { CommercialPath } from "@/components/CommercialPath";
import { DemoCards } from "@/components/DemoCards";
import { MethodLoop } from "@/components/Loops";
import { Container, Eyebrow, Reveal } from "@/components/Reveal";
import { SolutionInterestLink } from "@/components/SolutionInterestLink";
import { articles } from "@/lib/articles";
import { company } from "@/lib/company";
import {
  capabilities,
  demoNote,
  featuredArticleSlugs,
  informationSources,
  solutions,
  trustPrinciples,
} from "@/lib/content";
import { routeMeta, routePageMeta } from "@/lib/seo";

const featuredArticles = featuredArticleSlugs
  .map((slug) => articles.find((article) => article.slug === slug))
  .filter((article) => article != null);

export const metadata: Metadata = routePageMeta(routeMeta.home);

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--line) 1px, transparent 1px), linear-gradient(to bottom, var(--line) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            maskImage:
              "linear-gradient(to bottom, black 0%, transparent 85%)",
          }}
        />
        <Container className="relative pt-20 pb-16 md:pt-28 md:pb-20">
          <Reveal>
            <Eyebrow>{company.name}</Eyebrow>
            <h1 className="mt-6 max-w-4xl text-[44px] leading-[1.05] font-medium tracking-[-0.035em] text-ink sm:text-6xl md:text-[84px]">
              Improve the process.
              <br />
              Connect the systems.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-graphite md:text-[19px]">
              LoopSignal helps manufacturers improve how work, information, and
              decisions move through the organization.
            </p>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-graphite md:text-[19px]">
              We combine process improvement, systems integration, automation,
              and practical AI to build solutions around the way your operation
              actually works.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Button href="/loopscan" location="hero">
                Find Your First Loop
              </Button>
              <Button href="/demo" variant="text">
                See It in Action →
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="relative h-[46vh] min-h-[320px] max-h-[480px] overflow-hidden">
        <Image
          src="/images/plant.jpg"
          alt="Manufacturing plant floor with production equipment along a marked aisle"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-ink/35" />
        <div className="absolute inset-x-0 bottom-0">
          <Container className="pb-8">
            <p className="max-w-xl text-sm leading-6 text-white/85">
              Start with the work.
            </p>
          </Container>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <Eyebrow>The problem</Eyebrow>
              <h2 className="mt-5 text-3xl leading-tight font-medium tracking-[-0.03em] text-ink md:text-[40px]">
                Your operation already has the information. The challenge is
                connecting it to the work.
              </h2>
              <p className="mt-5 text-[16px] leading-7 text-graphite">
                ERP systems, email, spreadsheets, quality records, supplier
                updates, production reports, specifications, shared drives, and
                institutional knowledge already contain valuable information.
              </p>
              <p className="mt-4 text-[16px] leading-7 text-graphite">
                The problem is often how that information moves between people,
                systems, and decisions.
              </p>
              <p className="mt-4 text-[16px] leading-7 text-graphite">
                LoopSignal improves the process first, connects what should be
                connected, and automates what makes sense.
              </p>
            </Reveal>
            <Reveal className="lg:col-span-7" delay={80}>
              <ul className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3">
                {informationSources.map((source) => (
                  <li
                    key={source}
                    className="bg-cream px-4 py-4 text-sm text-ink"
                  >
                    {source}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-paper py-20 md:py-24">
        <Container>
          <Reveal>
            <Eyebrow>How we start</Eyebrow>
            <h2 className="mt-5 max-w-2xl text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
              Start with the work.
            </h2>
            <p className="mt-5 max-w-2xl text-[16px] leading-7 text-graphite">
              We do not begin by asking where AI can be used. We begin by
              understanding how the process works today, where the friction
              exists, and what outcome needs to improve.
            </p>
            <p className="mt-4 max-w-2xl text-[16px] leading-7 text-graphite">
              Sometimes the answer is process redesign. Sometimes it is systems
              integration. Sometimes it is automation or AI. Often it is a
              combination.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-px border border-line bg-line md:grid-cols-3">
            {capabilities.map((capability, index) => (
              <Reveal
                key={capability.name}
                delay={index * 50}
                className="bg-cream p-7 md:p-8"
              >
                <h3 className="text-xl font-medium tracking-tight text-ink">
                  {capability.name}
                </h3>
                <p className="mt-4 text-[15px] leading-7 text-graphite">
                  {capability.summary}
                </p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20 md:py-24">
        <Container>
          <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Eyebrow>Working demos</Eyebrow>
              <h2 className="mt-5 max-w-3xl text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
                See what a better operational loop can look like.
              </h2>
              <p className="mt-5 max-w-2xl text-[16px] leading-7 text-graphite">
                These demos are working examples of how process improvement,
                connected information, automation, and decision support can be
                applied to common manufacturing workflows.
              </p>
            </div>
            <Link
              href="/demo"
              className="shrink-0 text-[13px] font-medium tracking-[0.02em] text-copper hover:text-copper-dark"
            >
              All demos →
            </Link>
          </Reveal>
          <Reveal className="mt-10" delay={60}>
            <DemoCards />
          </Reveal>
          <Reveal className="mt-10 max-w-3xl" delay={80}>
            <p className="text-[16px] leading-7 text-graphite">{demoNote}</p>
          </Reveal>
        </Container>
      </section>

      <section className="border-y border-line bg-paper py-20 md:py-24">
        <Container>
          <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Eyebrow>Solutions</Eyebrow>
              <h2 className="mt-5 max-w-xl text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
                Operational problems LoopSignal can help solve.
              </h2>
            </div>
            <Link
              href="/solutions"
              className="text-[13px] font-medium tracking-[0.02em] text-copper hover:text-copper-dark"
            >
              All solutions →
            </Link>
          </Reveal>
          <div className="mt-12 grid gap-px border border-line bg-line md:grid-cols-2">
            {solutions.map((solution, index) => (
              <Reveal key={solution.slug} delay={index * 50} className="bg-cream">
                <SolutionInterestLink
                  href={`/solutions#${solution.slug}`}
                  solution={solution.interest}
                  interactionType="card_click"
                  className="block h-full p-8 transition-colors hover:bg-paper md:p-10"
                >
                  <h3 className="text-2xl font-medium tracking-tight text-ink">
                    {solution.outcome}
                  </h3>
                  <p className="mt-3 text-[12px] font-medium tracking-[0.04em] text-copper uppercase">
                    {solution.title}
                  </p>
                  <p className="mt-4 max-w-md text-[15px] leading-7 text-graphite">
                    {solution.summary}
                  </p>
                </SolutionInterestLink>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-ink py-20 text-cream md:py-28">
        <Container>
          <Reveal>
            <Eyebrow>How we work</Eyebrow>
            <h2 className="mt-5 max-w-2xl text-3xl font-medium tracking-[-0.03em] md:text-[40px]">
              See. Simplify. Connect. Automate. Measure. Improve.
            </h2>
          </Reveal>
          <Reveal className="mt-12" delay={80}>
            <MethodLoop />
          </Reveal>
        </Container>
      </section>

      <CommercialPath />

      <section className="py-20 md:py-24">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <Reveal className="relative aspect-[4/5] overflow-hidden lg:col-span-5">
              <Image
                src="/images/plant-interior.jpg"
                alt="Hands-on work on the manufacturing floor"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 40vw, 100vw"
              />
            </Reveal>
            <Reveal className="lg:col-span-7" delay={80}>
              <Eyebrow>Why LoopSignal</Eyebrow>
              <h2 className="mt-5 text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
                Better work. Not more software.
              </h2>
              <p className="mt-5 text-[16px] leading-7 text-graphite">
                LoopSignal works with the systems you already have whenever
                possible.
              </p>
              <p className="mt-4 text-[16px] leading-7 text-graphite">
                The goal is not to add another platform simply because one can
                be built. The goal is to improve the process and make your
                people, information, and systems work better together.
              </p>
              <p className="mt-8 font-serif text-2xl leading-snug text-ink">
                Technology should support judgment, not replace it blindly.
              </p>
            </Reveal>
          </div>
          <div className="mt-16 grid gap-px border border-line bg-line md:grid-cols-4">
            {trustPrinciples.map((principle, index) => (
              <Reveal
                key={principle.title}
                delay={index * 40}
                className="bg-cream p-6 md:p-7"
              >
                <h3 className="text-lg font-medium tracking-tight text-ink">
                  {principle.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-graphite">
                  {principle.text}
                </p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-line py-20 md:py-24">
        <Container>
          <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Eyebrow>Insights</Eyebrow>
              <h2 className="mt-5 text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
                On work, systems, and improvement.
              </h2>
            </div>
            <Link
              href="/insights"
              className="text-[13px] font-medium text-copper hover:text-copper-dark"
            >
              All insights →
            </Link>
          </Reveal>
          <div className="mt-12 grid gap-px border border-line bg-line md:grid-cols-3">
            {featuredArticles.map((article, index) => (
              <Reveal key={article.slug} delay={index * 50} className="bg-cream">
                <Link
                  href={`/insights/${article.slug}`}
                  className="flex h-full flex-col p-7 transition-colors hover:bg-paper"
                >
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-copper">
                    {article.category}
                  </p>
                  <h3 className="mt-3 text-lg font-medium tracking-tight text-ink">
                    {article.title}
                  </h3>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-ink py-20 text-cream md:py-28">
        <Container>
          <Reveal>
            <h2 className="max-w-3xl text-4xl font-medium tracking-[-0.035em] md:text-6xl">
              Find your first loop.
            </h2>
            <p className="mt-8 max-w-xl text-[17px] leading-8 text-white/60">
              Every operation has work that takes too long, information that is
              difficult to connect, and decisions that happen later than they
              should.
            </p>
            <p className="mt-4 max-w-xl text-[17px] leading-8 text-white/60">
              Start with one process. We’ll help you make it better.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Button href="/loopscan" variant="dark" location="final_cta">
                Start a LoopScan
              </Button>
              <Button href="/demo" variant="light">
                Explore the Demos
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
