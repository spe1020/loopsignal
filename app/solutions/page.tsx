import type { Metadata } from "next";
import Image from "next/image";
import { DemoCards } from "@/components/DemoCards";
import { Container, Eyebrow, Reveal } from "@/components/Reveal";
import { LoopScanOffer } from "@/components/LoopScanOffer";
import { SolutionInterestLink } from "@/components/SolutionInterestLink";
import { solutions } from "@/lib/content";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "Supply chain intelligence, procurement automation, manufacturing intelligence, and knowledge systems — plus LoopScan, LoopBuild, and LoopOps.",
  alternates: { canonical: "/solutions" },
  openGraph: {
    title: "Solutions",
    description:
      "Supply chain intelligence, procurement automation, manufacturing intelligence, and knowledge systems — plus LoopScan, LoopBuild, and LoopOps.",
    url: "/solutions",
  },
};

const solutionImages = [
  {
    src: "/images/warehouse.jpg",
    alt: "Warehouse aisle with pallet racking and stored materials",
  },
  {
    src: "/images/tablet-ops.jpg",
    alt: "Operations professional reviewing work on a tablet in a warehouse",
  },
  {
    src: "/images/assembly.jpg",
    alt: "Engineer working with production information at an assembly station",
  },
  {
    src: "/images/logistics.jpg",
    alt: "Parts storage with bins and racking in a distribution operation",
  },
];

export default function SolutionsPage() {
  return (
    <>
      <section className="border-b border-line py-20 md:py-28">
        <Container>
          <Reveal>
            <Eyebrow>Solutions</Eyebrow>
            <h1 className="mt-5 max-w-3xl text-4xl font-medium tracking-[-0.035em] text-ink md:text-6xl">
              Systems that make operational work faster, clearer, and more
              reliable.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-graphite">
              AI is a tool, not the headline. We build around the work:
              shortages, follow-up, reporting, search, and the decisions that
              currently wait on all of it.
            </p>
          </Reveal>
        </Container>
      </section>

      {solutions.map((solution, index) => (
        <section
          key={solution.slug}
          id={solution.slug}
          className={index % 2 === 1 ? "bg-paper" : "bg-cream"}
        >
          <Container className="grid items-center gap-12 py-20 lg:grid-cols-12 lg:gap-16 md:py-28">
            <Reveal className={index % 2 === 1 ? "lg:col-span-6 lg:order-2" : "lg:col-span-6"}>
              <div className="relative aspect-[5/4] overflow-hidden">
                <Image
                  src={solutionImages[index].src}
                  alt={solutionImages[index].alt}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              </div>
            </Reveal>
            <Reveal
              className={index % 2 === 1 ? "lg:col-span-6 lg:order-1" : "lg:col-span-6"}
              delay={80}
            >
              <p className="text-[12px] font-medium tracking-[0.04em] text-copper uppercase">
                {solution.title}
              </p>
              <h2 className="mt-3 text-3xl font-medium tracking-[-0.03em] text-ink md:text-4xl">
                {solution.outcome}
              </h2>
              <p className="mt-5 text-[16px] leading-7 text-graphite">
                {solution.summary}
              </p>
              <ul className="mt-8 grid gap-2 sm:grid-cols-2">
                {solution.examples.map((example) => (
                  <li
                    key={example}
                    className="flex gap-3 border-t border-line py-3 text-sm text-ink"
                  >
                    <span className="mt-2 h-px w-3 shrink-0 bg-copper" />
                    {example}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <SolutionInterestLink
                  href="/loopscan"
                  solution={solution.interest}
                  interactionType="cta_click"
                  className="text-[13px] font-medium tracking-[0.02em] text-copper hover:text-copper-dark"
                >
                  Find a loop in this area →
                </SolutionInterestLink>
              </div>
            </Reveal>
          </Container>
        </section>
      ))}

      <section className="border-t border-line py-16 md:py-20">
        <Container>
          <Reveal>
            <Eyebrow>See it in action</Eyebrow>
            <h2 className="mt-5 max-w-2xl text-3xl font-medium tracking-[-0.03em] text-ink md:text-[36px]">
              See LoopWorks in action.
            </h2>
            <p className="mt-5 max-w-2xl text-[16px] leading-7 text-graphite">
              Working examples of supply-risk, manufacturing-knowledge, and
              sourcing-decision workflows — not separate products you have to
              buy.
            </p>
          </Reveal>
          <Reveal className="mt-10" delay={60}>
            <DemoCards />
          </Reveal>
        </Container>
      </section>

      <LoopScanOffer ctaLocation="solutions" />
    </>
  );
}
