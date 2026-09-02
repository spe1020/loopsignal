import type { Metadata } from "next";
import { Button } from "@/components/Button";
import { Container, Eyebrow, Reveal } from "@/components/Reveal";
import { cta, services, servicesIntro } from "@/lib/content";
import { routeMeta, routePageMeta } from "@/lib/seo";

export const metadata: Metadata = routePageMeta(routeMeta.services);

export default function ServicesPage() {
  return (
    <>
      <section className="border-b border-line py-20 md:py-28">
        <Container>
          <Reveal>
            <Eyebrow>{servicesIntro.eyebrow}</Eyebrow>
            <h1 className="mt-5 max-w-3xl text-4xl font-medium tracking-[-0.035em] text-ink md:text-6xl">
              {servicesIntro.headline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-graphite">
              {servicesIntro.body}
            </p>
            <div className="mt-10">
              <Button href={cta.startLoopScan.href} location="services">
                {cta.startLoopScan.label}
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>

      {services.map((service, index) => (
        <section
          key={service.slug}
          id={service.slug}
          className={`scroll-mt-24 ${index % 2 === 1 ? "bg-paper" : "bg-cream"}`}
        >
          <Container className="grid gap-10 py-20 lg:grid-cols-12 lg:gap-16 md:py-28">
            <Reveal className="lg:col-span-5">
              <p className="font-mono text-[11px] tracking-[0.18em] text-copper">
                {service.step}
              </p>
              <h2 className="mt-4 text-4xl font-medium tracking-[-0.03em] text-ink md:text-5xl">
                {service.name}
              </h2>
              <p className="mt-4 text-[17px] font-medium text-ink">
                {service.headline}
              </p>
            </Reveal>
            <Reveal className="lg:col-span-7" delay={80}>
              <p className="text-[17px] leading-8 text-graphite">
                {service.text}
              </p>
              <div className="mt-8">
                <Button href={cta.startLoopScan.href} location="services">
                  {cta.startLoopScan.label}
                </Button>
              </div>
            </Reveal>
          </Container>
        </section>
      ))}
    </>
  );
}
