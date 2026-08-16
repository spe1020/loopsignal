import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/Button";
import { Container, Eyebrow, Reveal } from "@/components/Reveal";
import { company } from "@/lib/company";
import { cta, founder, trustPrinciples } from "@/lib/content";
import { routeMeta, routePageMeta } from "@/lib/seo";

export const metadata: Metadata = routePageMeta(routeMeta.about);

const beliefs = [
  {
    title: "Go to the gemba",
    text: "We understand the real work before proposing a solution. The floor, the inbox, the morning report — that is where the process actually lives.",
  },
  {
    title: "Improve before you automate",
    text: "Remove complexity before it is automated. A cleaner process connected to a capable system beats a clever tool wrapped around waste.",
  },
  {
    title: "Build working systems",
    text: "Recommendations are not the deliverable. A working loop is: information, decision, action, feedback, improvement.",
  },
  {
    title: "Keep people in the work",
    text: "The people closest to the work understand the problem. Human judgment stays where it adds value.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-line py-20 md:py-28">
        <Container>
          <Reveal>
            <Eyebrow>About</Eyebrow>
            <h1 className="mt-5 max-w-3xl text-4xl font-medium tracking-[-0.035em] text-ink md:text-6xl">
              A manufacturing consulting and systems integration company.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-graphite">
              {company.longDescription}
            </p>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-graphite">
              We improve processes, connect disconnected systems, and automate
              the work that does not require manual effort.
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
            <Eyebrow>Founder</Eyebrow>
            <h2 className="mt-5 text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
              Built by an operator.
            </h2>
            <p className="mt-6 text-[16px] leading-8 text-graphite">
              LoopSignal was created from firsthand experience solving problems
              across manufacturing, supply chain, procurement, supplier
              development, production planning, operations, and continuous
              improvement.
            </p>
            <p className="mt-4 text-[16px] leading-8 text-graphite">
              {founder.background}
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

      <section className="border-b border-line py-20 md:py-24">
        <Container>
          <Reveal className="max-w-3xl">
            <p className="text-[16px] leading-8 text-graphite">
              The problems behind the demos on this site are familiar: people
              chasing information, rebuilding reports, comparing options
              manually, searching for documents, managing exceptions, and
              coordinating action across disconnected systems.
            </p>
            <p className="mt-8 font-serif text-2xl leading-snug text-ink md:text-[28px]">
              LoopSignal exists to make those loops work better.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="py-24 md:py-32">
        <Container className="grid gap-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <Eyebrow>How we think</Eyebrow>
            <h2 className="mt-5 text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
              Go to the work. Then build the system.
            </h2>
            <p className="mt-6 text-[16px] leading-8 text-graphite">
              Too many projects start in a conference room with a capability
              list. We start at the gemba — the real place the work happens —
              because that is where friction, workarounds, and tribal knowledge
              show themselves.
            </p>
            <p className="mt-5 text-[16px] leading-8 text-graphite">
              From there the sequence is disciplined: see, simplify, connect,
              automate, measure, improve. Technology follows the problem, not
              the other way around.
            </p>
          </Reveal>
          <div className="grid gap-px border border-line bg-line lg:col-span-7 sm:grid-cols-2">
            {beliefs.map((belief, index) => (
              <Reveal
                key={belief.title}
                delay={index * 60}
                className="bg-cream p-7"
              >
                <h3 className="text-lg font-medium tracking-tight text-ink">
                  {belief.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-graphite">
                  {belief.text}
                </p>
              </Reveal>
            ))}
          </div>
        </Container>
        <Container className="mt-16">
          <div className="grid gap-px border border-line bg-line md:grid-cols-4">
            {trustPrinciples.map((principle) => (
              <div key={principle.title} className="bg-cream p-6">
                <h3 className="text-[15px] font-medium tracking-tight text-ink">
                  {principle.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-graphite">
                  {principle.text}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-paper py-24 md:py-32">
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
            <Eyebrow>Who we work with</Eyebrow>
            <h2 className="mt-5 text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
              Built for people who run operations, not for people who collect
              pilots.
            </h2>
            <p className="mt-6 text-[16px] leading-8 text-graphite">
              Plant managers, supply chain leaders, procurement teams, and
              operations executives. Companies large enough that the work is
              real — and serious enough that a better system has to earn its
              place on the floor.
            </p>
            <p className="mt-5 font-serif text-2xl leading-snug text-ink">
              Improve the process. Connect the systems.
            </p>
            <div className="mt-10">
              <Button href={cta.primary.href} location="about">
                {cta.primary.label}
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
