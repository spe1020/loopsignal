import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/Button";
import { CommercialPath } from "@/components/CommercialPath";
import { DemoCards } from "@/components/DemoCards";
import { Container, Eyebrow, Reveal } from "@/components/Reveal";
import { SampleDataCaption } from "@/components/SampleDataCaption";
import { articles } from "@/lib/articles";
import {
  capabilities,
  cta,
  demoNote,
  featuredArticleSlugs,
  fitCheckNote,
  founder,
  homepageFinding,
  loopScanOffer,
  painPoints,
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
            <Eyebrow>Start with the work.</Eyebrow>
            <h1 className="mt-6 max-w-4xl text-[44px] leading-[1.05] font-medium tracking-[-0.035em] text-ink sm:text-6xl md:text-[84px]">
              Improve the process.
              <br />
              Connect the systems.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-graphite md:text-[19px]">
              Your team knows where the work gets stuck. Chasing confirmations.
              Rebuilding the same report every morning. Waiting on the one
              person who knows.
            </p>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-graphite md:text-[19px]">
              We fix the process first, connect what should be connected, and
              automate only what earns it.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <div>
                <Button href={cta.fitCheck.href} location="hero">
                  {cta.fitCheck.label}
                </Button>
                <p className="mt-2 text-[13px] leading-5 text-graphite">
                  {fitCheckNote}
                </p>
              </div>
              <Button href={cta.seeDemos.href} variant="text">
                {cta.seeDemos.label} →
              </Button>
            </div>
            <div className="mt-12 max-w-2xl border border-dashed border-line bg-cream px-5 py-5 md:px-6 md:py-6">
              <SampleDataCaption />
              <p className="mt-3 text-[16px] leading-7 text-ink md:text-[17px]">
                {homepageFinding.text}
              </p>
              <p className="mt-3 text-sm leading-6 text-graphite">
                {homepageFinding.source}
              </p>
              <a
                href={loopScanOffer.samplePdf.href}
                download={loopScanOffer.samplePdf.filename}
                className="mt-3 inline-block text-sm font-medium text-copper hover:text-copper-dark"
              >
                {loopScanOffer.samplePdf.cta} →
              </a>
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="border-t border-line bg-paper py-8 md:py-10">
        <Container>
          <Eyebrow>LoopScan</Eyebrow>
          <p className="mt-3 text-[18px] font-medium leading-7 tracking-tight text-ink md:text-[20px]">
            {loopScanOffer.priceLine}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
            <div>
              <Button href={cta.fitCheck.href} location="loopscan_section">
                {cta.fitCheck.label}
              </Button>
              <p className="mt-2 text-[13px] leading-5 text-graphite">
                {fitCheckNote}
              </p>
            </div>
            <Button href={cta.startLoopScan.href} variant="text">
              {cta.startLoopScan.label} →
            </Button>
          </div>
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
          <Reveal>
            <Eyebrow>The work</Eyebrow>
            <h2 className="mt-5 max-w-3xl text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
              The work shouldn’t be this hard.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-px border border-line bg-line md:grid-cols-2">
            {painPoints.map((point, index) => (
              <Reveal
                key={point}
                delay={index * 40}
                className="bg-cream p-7 md:p-10"
              >
                <p className="text-xl font-medium tracking-tight text-ink md:text-2xl">
                  {point}
                </p>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10 max-w-3xl">
            <p className="text-[16px] leading-7 text-graphite">
              These are not software problems. They are process, information,
              ownership, and system problems.
            </p>
            <p className="mt-4 text-[16px] leading-7 text-ink">
              LoopSignal improves the process, connects what should be
              connected, and automates the work that shouldn’t require manual
              effort.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="border-y border-line bg-paper py-20 md:py-24">
        <Container>
          <Reveal>
            <Eyebrow>What LoopSignal does</Eyebrow>
            <h2 className="mt-5 max-w-2xl text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
              Process. Systems. Automation where it earns its place.
            </h2>
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
          <Reveal className="mt-10 max-w-3xl">
            <p className="font-serif text-2xl leading-snug text-ink">
              Software may be part of the solution. It is not automatically the
              solution.
            </p>
          </Reveal>
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
                Working examples of how workflows can be redesigned around
                supply, knowledge, sourcing, reporting, ownership, and action.
              </p>
            </div>
            <Link
              href={cta.seeDemos.href}
              className="shrink-0 text-[13px] font-medium tracking-[0.02em] text-copper hover:text-copper-dark"
            >
              {cta.seeDemos.label} →
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
          <Reveal>
            <Eyebrow>How we think</Eyebrow>
            <h2 className="mt-5 max-w-2xl text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
              Technology follows the problem.
            </h2>
            <p className="mt-5 max-w-2xl text-[16px] leading-7 text-graphite">
              Sometimes the answer is a process change. Sometimes systems
              integration. Sometimes automation, software, or AI. Often a
              combination. Sometimes it’s no technology at all.
            </p>
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
              <Eyebrow>Operator</Eyebrow>
              <h2 className="mt-5 text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
                Built from the floor, not from a product roadmap.
              </h2>
              <p className="mt-5 text-[16px] leading-7 text-graphite">
                {founder.background}
              </p>
              <p className="mt-4 text-[16px] leading-7 text-graphite">
                The proof on this site is operational problem-solving, systems
                thinking, working demos, and a clear method. Not logos. Not
                testimonials.
              </p>
              <p className="mt-8 font-serif text-2xl leading-snug text-ink">
                Technology follows the problem.
              </p>
              <Link
                href="/about"
                className="mt-8 inline-flex text-[13px] font-medium text-copper hover:text-copper-dark"
              >
                About →
              </Link>
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
              What process should work better?
            </h2>
            <p className="mt-8 max-w-xl text-[17px] leading-8 text-white/60">
              If your team spends too much time searching, rebuilding, chasing,
              reconciling, or moving information between systems by hand, start
              there.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <div>
                <Button
                  href={cta.fitCheck.href}
                  variant="dark"
                  location="final_cta"
                >
                  {cta.fitCheck.label}
                </Button>
                <p className="mt-2 text-[13px] leading-5 text-white/50">
                  {fitCheckNote}
                </p>
              </div>
              <Button href={cta.startLoopScan.href} variant="light">
                {cta.startLoopScan.label}
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
