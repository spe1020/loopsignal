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
import {
  cta,
  capabilities,
  demoNote,
  featuredArticleSlugs,
  informationSources,
  loopScanOffer,
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
            <Eyebrow>Consulting. Not software.</Eyebrow>
            <h1 className="mt-6 max-w-4xl text-[44px] leading-[1.05] font-medium tracking-[-0.035em] text-ink sm:text-6xl md:text-[84px]">
              Buyers chasing overdue POs by hand.
              <br />
              Critical work living with one person who knows where everything
              is.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-graphite md:text-[19px]">
              This is for you if your buyers work out of Excel exports from an
              ERP older than they are. It is not for you if you need a software
              platform, a subscription, or another dashboard.
            </p>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-graphite md:text-[19px]">
              {loopScanOffer.budgetLine}
            </p>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-ink md:text-[19px]">
              {loopScanOffer.priceLine}.
            </p>
            <p className="mt-3 max-w-2xl text-[16px] leading-7 text-graphite">
              {loopScanOffer.firstClient}
            </p>
            <p className="mt-5 max-w-2xl font-serif text-2xl leading-snug text-ink md:text-[28px]">
              {loopScanOffer.credibleNextStep}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Button href={cta.primary.href} location="hero">
                {cta.primary.label}
              </Button>
              <Button href={cta.secondary.href} variant="text">
                {cta.secondary.label} →
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
              <Eyebrow>The work</Eyebrow>
              <h2 className="mt-5 text-3xl leading-tight font-medium tracking-[-0.03em] text-ink md:text-[40px]">
                Your operation already has the information. Connecting it to
                the work is the job.
              </h2>
              <p className="mt-5 text-[16px] leading-7 text-graphite">
                ERP systems, email, spreadsheets, quality records, supplier
                updates, production reports, specifications, shared drives, and
                institutional knowledge already contain the record.
              </p>
              <p className="mt-4 text-[16px] leading-7 text-graphite">
                The problem is how that information moves between people,
                systems, and decisions.
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
              We do not begin by asking where AI belongs. We begin by
              understanding how the process works today, where the friction
              exists, and what outcome needs to improve.
            </p>
            <p className="mt-4 max-w-2xl text-[16px] leading-7 text-graphite">
              Sometimes the answer is process redesign. Sometimes it is systems
              integration. Sometimes it is automation or AI. Sometimes it is
              all three.
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
                See what a better operational loop looks like.
              </h2>
              <p className="mt-5 max-w-2xl text-[16px] leading-7 text-graphite">
                These demos are working examples of process improvement,
                connected information, automation, and decision support on
                common manufacturing workflows.
              </p>
            </div>
            <Link
              href="/demo"
              className="shrink-0 text-[13px] font-medium tracking-[0.02em] text-copper hover:text-copper-dark"
            >
              {cta.secondary.label} →
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
                Work we take on.
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
                The goal is not to add another platform because one is
                available. The goal is to improve the process and make your
                people, information, and systems work together.
              </p>
              <p className="mt-8 font-serif text-2xl leading-snug text-ink">
                Technology supports judgment. It does not replace it.
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
              {loopScanOffer.priceLine}.
            </h2>
            <p className="mt-8 max-w-xl text-[17px] leading-8 text-white/60">
              {loopScanOffer.guarantee}
            </p>
            <p className="mt-4 max-w-xl text-[17px] leading-8 text-white/60">
              Start with one process.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Button href={cta.primary.href} variant="dark" location="final_cta">
                {cta.primary.label}
              </Button>
              <Button href={cta.secondary.href} variant="light">
                {cta.secondary.label}
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
