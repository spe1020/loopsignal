import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/Button";
import { Container, Eyebrow, Reveal } from "@/components/Reveal";
import { services, solutions } from "@/lib/content";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "Supply chain intelligence, procurement automation, manufacturing intelligence, and knowledge systems — plus LoopScan, LoopBuild, and LoopOps.",
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
              <p className="font-mono text-[11px] tracking-[0.16em] text-copper">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-4 text-3xl font-medium tracking-[-0.03em] text-ink md:text-4xl">
                {solution.title}
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
            </Reveal>
          </Container>
        </section>
      ))}

      <section className="border-t border-line py-24 md:py-32">
        <Container>
          <Reveal>
            <Eyebrow>Services</Eyebrow>
            <h2 className="mt-5 max-w-2xl text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
              Three ways to work together.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-px border border-line bg-line lg:grid-cols-3">
            {services.map((service) => (
              <div key={service.slug} className="flex flex-col bg-cream p-8 md:p-10">
                <h3 className="text-2xl font-medium tracking-tight text-ink">
                  {service.name}
                </h3>
                <p className="mt-4 text-[15px] leading-7 text-graphite">
                  {service.summary}
                </p>
                <ul className="mt-8 flex-1 space-y-2.5">
                  {service.deliverables.map((item) => (
                    <li key={item} className="text-sm text-graphite">
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-10">
                  <Button href={`/talk-to-us?intent=${service.slug}`}>
                    {service.cta}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
