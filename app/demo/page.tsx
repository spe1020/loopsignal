import type { Metadata } from "next";
import { Button } from "@/components/Button";
import { DemoCards } from "@/components/DemoCards";
import { Container, Eyebrow, Reveal } from "@/components/Reveal";
import { cta, demoNote, demoPhilosophy } from "@/lib/content";
import { routeMeta, routePageMeta } from "@/lib/seo";

export const metadata: Metadata = routePageMeta(routeMeta.demo);

export default function DemoPage() {
  return (
    <section className="py-16 md:py-24">
      <Container>
        <Reveal>
          <Eyebrow>Demos</Eyebrow>
          <h1 className="mt-5 max-w-3xl text-4xl font-medium tracking-[-0.035em] text-ink md:text-6xl">
            See what a better operational loop looks like.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-graphite">
            These demos are working examples of process improvement, connected
            information, automation, and decision support on common
            manufacturing workflows.
          </p>
        </Reveal>
        <Reveal className="mt-12" delay={60}>
          <DemoCards variant="showcase" />
        </Reveal>
        <Reveal className="mt-16 border-t border-line pt-16" delay={80}>
          <h2 className="max-w-2xl text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
            Different workflows. Same philosophy.
          </h2>
          <ul className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2">
            {demoPhilosophy.map((item) => (
              <li key={item.name} className="bg-cream p-6 md:p-7">
                <p className="text-[12px] font-medium tracking-[0.04em] text-copper uppercase">
                  {item.name}
                </p>
                <p className="mt-3 text-lg font-medium tracking-tight text-ink">
                  {item.line}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-3xl text-[16px] leading-7 text-graphite">
            LoopSignal adapts the approach to the process, systems, and needs of
            each manufacturer.
          </p>
          <p className="mt-4 max-w-3xl text-[16px] leading-7 text-graphite">
            {demoNote}
          </p>
          <div className="mt-10">
            <Button href={cta.primary.href} location="demo">
              {cta.primary.label}
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
