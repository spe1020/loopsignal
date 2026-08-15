import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CommercialPath } from "@/components/CommercialPath";
import { Container, Eyebrow, Reveal } from "@/components/Reveal";
import { SolutionInterestLink } from "@/components/SolutionInterestLink";
import { solutions } from "@/lib/content";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "Process improvement, systems integration, and practical automation for supply chain, procurement, plant operations, and manufacturing knowledge — plus LoopScan, LoopBuild, and LoopOps.",
  alternates: { canonical: "/solutions" },
  openGraph: {
    title: "Solutions",
    description:
      "Process improvement, systems integration, and practical automation for supply chain, procurement, plant operations, and manufacturing knowledge — plus LoopScan, LoopBuild, and LoopOps.",
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
              Operational problems LoopSignal can help solve.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-graphite">
              We start with the work: shortages, purchasing, plant operations,
              and knowledge. Each area has a working demo that shows what a
              better loop can look like — not a fixed product every manufacturer
              is expected to adopt.
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
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href={solution.demoHref}
                  className="text-[13px] font-medium tracking-[0.02em] text-copper hover:text-copper-dark"
                >
                  See it in action → {solution.demoName}
                </Link>
                <SolutionInterestLink
                  href="/loopscan"
                  solution={solution.interest}
                  interactionType="cta_click"
                  className="text-[13px] font-medium tracking-[0.02em] text-stone hover:text-ink"
                >
                  Find a loop in this area →
                </SolutionInterestLink>
              </div>
            </Reveal>
          </Container>
        </section>
      ))}

      <CommercialPath ctaLocation="solutions" showLoopBuildDetail={false} />
    </>
  );
}
