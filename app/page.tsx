import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/Button";
import { LoopScanOffer } from "@/components/LoopScanOffer";
import { MethodLoop } from "@/components/Loops";
import { Container, Eyebrow, Reveal } from "@/components/Reveal";
import { SolutionInterestLink } from "@/components/SolutionInterestLink";
import { SystemsFlow } from "@/components/SystemsFlow";
import { articles } from "@/lib/articles";
import {
  featuredArticleSlugs,
  informationSources,
  solutions,
  trustPrinciples,
  useCases,
} from "@/lib/content";

const featuredArticles = featuredArticleSlugs
  .map((slug) => articles.find((article) => article.slug === slug))
  .filter((article) => article != null);

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

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
            <Eyebrow>LoopWorks</Eyebrow>
            <h1 className="mt-6 max-w-4xl text-[44px] leading-[1.05] font-medium tracking-[-0.035em] text-ink sm:text-6xl md:text-[84px]">
              Better systems.
              <br />
              Better work.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-graphite md:text-[19px]">
              We help manufacturers eliminate repetitive work, connect
              disconnected information, and make better operational decisions
              using AI, automation, and process improvement.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Button href="/loopscan" location="hero">
                Find Your First Loop
              </Button>
              <Button href="/solutions" variant="text">
                See What We Build →
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
              The information is already there. The challenge is getting the
              right information to the right person at the right time.
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
                Your systems have the information. Your people are still doing
                the work to connect it.
              </h2>
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
          <div className="grid items-start gap-12 lg:grid-cols-12">
            <Reveal className="relative hidden aspect-[4/5] overflow-hidden lg:col-span-5 lg:block">
              <Image
                src="/images/gemba.jpg"
                alt="A manufacturing technician inspecting equipment on the shop floor"
                fill
                className="object-cover"
                sizes="40vw"
              />
            </Reveal>
            <div className="lg:col-span-7">
              <Reveal>
                <Eyebrow>Where we start</Eyebrow>
                <h2 className="mt-5 text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
                  Show us the process your team hates doing.
                </h2>
                <p className="mt-5 text-[16px] leading-7 text-graphite">
                  These are the kinds of problems LoopWorks is built to solve.
                </p>
              </Reveal>
              <ul className="mt-8 divide-y divide-line border-y border-line">
                {useCases.map((item, index) => (
                  <li
                    key={item}
                    className="flex gap-5 py-3.5 text-[15px] leading-6 text-ink"
                  >
                    <span className="font-mono text-[11px] tracking-[0.12em] text-copper">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button href="/loopscan" location="use_cases">
                  Find Your First Loop
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-20 md:py-24">
        <Container>
          <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Eyebrow>Solutions</Eyebrow>
              <h2 className="mt-5 max-w-xl text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
                Practical systems for the work that actually moves.
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

      <section className="border-y border-line bg-paper py-20 md:py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <Eyebrow>Knowledge systems</Eyebrow>
            <h2 className="mt-5 text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
              What happens when the person who knows everything retires?
            </h2>
            <p className="mt-6 max-w-xl text-[16px] leading-8 text-graphite">
              Critical manufacturing knowledge often lives across experienced
              employees, documents, shared drives, emails, and old systems.
              LoopWorks can turn that knowledge into a secure, searchable system
              your team can actually use.
            </p>
            <div className="mt-8">
              <SolutionInterestLink
                href="/solutions#knowledge-systems"
                solution="knowledge"
                interactionType="learn_more"
                className="text-[13px] font-medium tracking-[0.02em] text-copper hover:text-copper-dark"
              >
                See knowledge systems →
              </SolutionInterestLink>
            </div>
          </Reveal>
          <Reveal className="relative aspect-[5/4] overflow-hidden lg:col-span-6" delay={80}>
            <Image
              src="/images/assembly.jpg"
              alt="An engineer working with production information at an assembly station"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </Reveal>
        </Container>
      </section>

      <section className="bg-ink py-20 text-cream md:py-28">
        <Container>
          <Reveal>
            <Eyebrow>The LoopWorks Method</Eyebrow>
            <h2 className="mt-5 max-w-2xl text-3xl font-medium tracking-[-0.03em] md:text-[40px]">
              See. Simplify. Build. Learn.
            </h2>
          </Reveal>
          <Reveal className="mt-12" delay={80}>
            <MethodLoop />
          </Reveal>
          <Reveal className="mt-14 max-w-2xl" delay={100}>
            <h3 className="text-2xl font-medium tracking-tight">
              Technology should serve the work.
            </h3>
            <p className="mt-4 text-[16px] leading-7 text-white/60">
              We simplify the process before automating it, keep human judgment
              where it matters, and continuously improve what we build.
            </p>
            <p className="mt-6 font-serif text-2xl text-cream">
              We build better loops.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="border-y border-line bg-paper py-20 md:py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <Eyebrow>How we work with you</Eyebrow>
            <h2 className="mt-5 text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
              Better work. Not more software.
            </h2>
            <p className="mt-5 text-[16px] leading-7 text-graphite">
              LoopWorks works with the systems you already have whenever
              possible.
            </p>
            <p className="mt-4 text-[16px] leading-7 text-graphite">
              The goal is not to add another platform, dashboard, or piece of
              software your team has to manage. The goal is to make your
              existing people, processes, information, and technology work
              better together.
            </p>
          </Reveal>
          <Reveal className="lg:col-span-7" delay={80}>
            <SystemsFlow />
          </Reveal>
        </Container>
      </section>

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
              <Eyebrow>Why LoopWorks</Eyebrow>
              <h2 className="mt-5 text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
                Built from the work.
              </h2>
              <p className="mt-5 text-[16px] leading-7 text-graphite">
                LoopWorks was built from firsthand experience across
                manufacturing, supply chain, procurement, supplier development,
                production planning, continuous improvement, and manufacturing
                engineering.
              </p>
              <p className="mt-4 text-[16px] leading-7 text-graphite">
                We understand the reality behind ERP systems, supplier problems,
                production constraints, inventory risk, quality issues,
                spreadsheets, manual reporting, and the workarounds teams use
                every day.
              </p>
              <p className="mt-8 font-serif text-2xl leading-snug text-ink">
                We do not start with AI. We start with the work.
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

      <LoopScanOffer />

      <section className="py-20 md:py-24">
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
              Every organization has work that takes too long, information that
              is difficult to find, and decisions that happen later than they
              should.
            </p>
            <p className="mt-4 max-w-xl text-[17px] leading-8 text-white/60">
              That is where we start.
            </p>
            <p className="mt-8 font-serif text-2xl text-cream md:text-[28px]">
              Show us the process. We’ll help you make it better.
            </p>
            <div className="mt-10">
              <Button href="/loopscan" variant="dark" location="final_cta">
                Start a LoopScan
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
