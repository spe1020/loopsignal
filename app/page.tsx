import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/Button";
import { OperationalLoop } from "@/components/Loops";
import { Container, Eyebrow, Reveal } from "@/components/Reveal";
import { articles } from "@/lib/articles";
import {
  informationSources,
  philosophy,
  services,
  solutions,
  useCases,
} from "@/lib/content";

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
        <Container className="relative pt-20 pb-16 md:pt-28 md:pb-24">
          <Reveal>
            <Eyebrow>LoopWorks</Eyebrow>
            <h1 className="mt-6 max-w-4xl text-[44px] leading-[1.05] font-medium tracking-[-0.035em] text-ink sm:text-6xl md:text-[84px]">
              Better systems.
              <br />
              Better work.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-graphite md:text-[19px]">
              LoopWorks helps manufacturers improve the flow of work,
              information, and decisions through practical AI, automation, and
              process improvement.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button href="/talk-to-us">Find Your First Loop</Button>
              <Button href="/solutions" variant="secondary">
                See What We Build
              </Button>
            </div>
          </Reveal>
          <Reveal className="mt-16 md:mt-20" delay={120}>
            <OperationalLoop />
          </Reveal>
        </Container>
      </section>

      <section className="relative h-[52vh] min-h-[360px] max-h-[560px] overflow-hidden">
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
              The information is already in the plant. The work is getting it to
              the right person at the right time.
            </p>
          </Container>
        </div>
      </section>

      <section className="py-24 md:py-32">
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
              <p className="text-[17px] leading-8 text-graphite">
                Manufacturers often have information spread across ERP systems,
                spreadsheets, email, supplier correspondence, specifications,
                quality records, production reports, shared drives, and employee
                knowledge.
              </p>
              <p className="mt-5 text-[17px] leading-8 text-graphite">
                The problem is often not missing information. It is getting the
                right information to the right person at the right time.
                LoopWorks connects those pieces into better operational
                workflows.
              </p>
              <ul className="mt-10 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3">
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

      <section className="border-y border-line bg-paper py-24 md:py-32">
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
          <div className="mt-14 grid gap-px border border-line bg-line md:grid-cols-2">
            {solutions.map((solution, index) => (
              <Reveal
                key={solution.slug}
                delay={index * 60}
                className="bg-cream p-8 md:p-10"
              >
                <span className="font-mono text-[11px] tracking-[0.16em] text-copper">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-5 text-2xl font-medium tracking-tight text-ink">
                  {solution.title}
                </h3>
                <p className="mt-4 max-w-md text-[15px] leading-7 text-graphite">
                  {solution.summary}
                </p>
                <ul className="mt-8 flex flex-wrap gap-2">
                  {solution.examples.map((example) => (
                    <li
                      key={example}
                      className="border border-line px-3 py-1.5 text-[12px] text-graphite"
                    >
                      {example}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-ink py-24 text-cream md:py-32">
        <Container>
          <Reveal>
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-5 max-w-2xl text-3xl font-medium tracking-[-0.03em] md:text-[40px]">
              See. Simplify. Build. Learn. Repeat.
            </h2>
            <p className="mt-5 max-w-xl text-[16px] leading-7 text-white/60">
              We go to the work first. Then we improve the process. Then we
              build a system. Then we measure, and start again.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-px bg-white/10 md:grid-cols-4">
            {[
              {
                n: "01",
                name: "See",
                text: "Go to the work. Find delays, workarounds, and disconnected information.",
              },
              {
                n: "02",
                name: "Simplify",
                text: "Improve the process before automating it. Define decisions and ownership.",
              },
              {
                n: "03",
                name: "Build",
                text: "Connect AI, automation, ERP, documents, and people into a working system.",
              },
              {
                n: "04",
                name: "Learn",
                text: "Measure the impact. Identify the next constraint. Improve again.",
              },
            ].map((step, index) => (
              <Reveal
                key={step.name}
                delay={index * 70}
                className="bg-ink px-6 py-8 md:min-h-[280px] md:px-7"
              >
                <p className="font-mono text-[11px] tracking-[0.16em] text-copper">
                  {step.n}
                </p>
                <h3 className="mt-8 text-2xl font-medium tracking-tight">
                  {step.name}
                </h3>
                <p className="mt-4 text-sm leading-6 text-white/55">
                  {step.text}
                </p>
              </Reveal>
            ))}
          </div>
          <p className="mt-8 text-center text-[12px] tracking-[0.16em] text-white/40 uppercase">
            A continuous loop — not a one-time project
          </p>
          <div className="mt-10">
            <Button href="/how-it-works" variant="light">
              How we work
            </Button>
          </div>
        </Container>
      </section>

      <section className="py-24 md:py-32">
        <Container>
          <Reveal>
            <Eyebrow>Services</Eyebrow>
            <h2 className="mt-5 max-w-xl text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
              Start small. Build something real. Keep improving.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {services.map((service, index) => (
              <Reveal
                key={service.slug}
                delay={index * 70}
                className="flex flex-col border border-line bg-cream p-8"
              >
                <h3 className="text-2xl font-medium tracking-tight text-ink">
                  {service.name}
                </h3>
                <p className="mt-4 flex-1 text-[15px] leading-7 text-graphite">
                  {service.summary}
                </p>
                <ul className="mt-8 space-y-2">
                  {service.deliverables.slice(0, 5).map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 text-sm text-graphite"
                    >
                      <span className="mt-2 h-px w-3 shrink-0 bg-copper" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/talk-to-us?intent=${service.slug}`}
                  className="mt-10 text-[13px] font-medium text-copper hover:text-copper-dark"
                >
                  {service.cta} →
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-paper py-24 md:py-32">
        <Container>
          <div className="grid gap-16 lg:grid-cols-12">
            <Reveal className="lg:col-span-4">
              <Eyebrow>Philosophy</Eyebrow>
              <h2 className="mt-5 text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
                Technology should serve the work.
              </h2>
            </Reveal>
            <div className="lg:col-span-8">
              <ul className="divide-y divide-line border-y border-line">
                {philosophy.map((line, index) => (
                  <Reveal key={line} delay={index * 50}>
                    <li className="py-6 font-serif text-xl leading-snug text-ink md:text-[26px]">
                      {line}
                    </li>
                  </Reveal>
                ))}
              </ul>
              <p className="mt-10 text-2xl font-medium tracking-tight text-copper">
                We build better loops.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-24 md:py-32">
        <Container>
          <div className="grid items-start gap-12 lg:grid-cols-12">
            <Reveal className="relative aspect-[4/5] overflow-hidden lg:col-span-5">
              <Image
                src="/images/gemba.jpg"
                alt="A manufacturing technician inspecting equipment on the shop floor"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 40vw, 100vw"
              />
            </Reveal>
            <div className="lg:col-span-7">
              <Reveal>
                <Eyebrow>Where we start</Eyebrow>
                <h2 className="mt-5 text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
                  Show us the process your team hates doing.
                </h2>
                <p className="mt-5 text-[16px] leading-7 text-graphite">
                  These are not side tasks. They are the connective tissue of
                  the operation — and they are ideal starting points for
                  LoopWorks.
                </p>
              </Reveal>
              <ul className="mt-10 divide-y divide-line border-y border-line">
                {useCases.map((item, index) => (
                  <li
                    key={item}
                    className="flex gap-5 py-4 text-[15px] leading-6 text-ink"
                  >
                    <span className="font-mono text-[11px] tracking-[0.12em] text-copper">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <Button href="/talk-to-us">Find Your First Loop</Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-line bg-paper py-24 md:py-32">
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
          <div className="mt-14 grid gap-px border border-line bg-line md:grid-cols-3">
            {articles.slice(0, 3).map((article, index) => (
              <Reveal key={article.slug} delay={index * 70} className="bg-cream">
                <Link
                  href={`/insights/${article.slug}`}
                  className="flex h-full flex-col p-8 transition-colors hover:bg-paper"
                >
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-copper">
                    {article.category}
                  </p>
                  <h3 className="mt-4 text-xl font-medium tracking-tight text-ink">
                    {article.title}
                  </h3>
                  <p className="mt-4 flex-1 text-sm leading-6 text-graphite">
                    {article.dek}
                  </p>
                  <p className="mt-8 text-[12px] text-stone">
                    {article.readTime}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-ink py-24 text-cream md:py-32">
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
              <Button href="/talk-to-us" variant="dark">
                Talk to LoopWorks
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
