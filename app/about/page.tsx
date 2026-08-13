import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/Button";
import { Container, Eyebrow, Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "LoopWorks was built around a simple belief: manufacturing does not need more technology for technology’s sake. It needs better systems.",
};

const beliefs = [
  {
    title: "Go to the gemba",
    text: "We understand the real work before proposing a solution. The floor, the inbox, the morning report — that is where the process actually lives.",
  },
  {
    title: "Improve before you automate",
    text: "Complexity should be removed before it is automated. A cleaner process connected to a capable system beats a clever tool wrapped around waste.",
  },
  {
    title: "Build working systems",
    text: "Recommendations are not the deliverable. A working loop is: information, decision, action, feedback, improvement.",
  },
  {
    title: "Keep people in the work",
    text: "The people closest to the work often understand the problem best. Human judgment should remain where it adds value.",
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
              Manufacturing does not need more technology for technology’s sake.
              It needs better systems.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-graphite">
              LoopWorks was built around firsthand experience in manufacturing,
              supply chain, procurement, supplier development, operations, and
              continuous improvement.
            </p>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-graphite">
              We understand the realities behind ERP systems, supplier problems,
              production constraints, spreadsheets, quality issues, inventory
              risk, and the workarounds teams use every day.
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
              From there the sequence is disciplined: see, simplify, build,
              learn. AI is one of the tools in the build step. It is not the
              reason for the work.
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
              We build better loops.
            </p>
            <div className="mt-10">
              <Button href="/first-loop">Find Your First Loop</Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
