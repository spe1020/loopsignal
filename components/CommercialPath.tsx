import { Button } from "@/components/Button";
import { Container, Eyebrow, Reveal } from "@/components/Reveal";
import { cta, services, servicesIntro } from "@/lib/content";

export function CommercialPath() {
  return (
    <section className="border-y border-line bg-paper py-20 md:py-28">
      <Container>
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>How we work with you</Eyebrow>
            <h2 className="mt-5 max-w-2xl text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
              {servicesIntro.headline}
            </h2>
          </div>
          <Button href="/services" variant="text" className="shrink-0">
            All services →
          </Button>
        </Reveal>

        <div className="mt-12 grid gap-px border border-line bg-line md:grid-cols-3">
          {services.map((item, index) => (
            <Reveal
              key={item.slug}
              delay={index * 60}
              className="flex flex-col bg-cream p-7 md:p-8"
            >
              <p className="font-mono text-[11px] tracking-[0.16em] text-copper">
                {item.step}
              </p>
              <h3 className="mt-5 text-2xl font-medium tracking-tight text-ink">
                {item.name}
              </h3>
              <p className="mt-2 text-[15px] font-medium text-ink">
                {item.headline}
              </p>
              <p className="mt-3 flex-1 text-[15px] leading-6 text-graphite">
                {item.text}
              </p>
              <div className="mt-6">
                <Button
                  href={cta.startLoopScan.href}
                  variant={index === 0 ? "primary" : "secondary"}
                  location="services"
                >
                  {cta.startLoopScan.label}
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-center text-[12px] tracking-[0.16em] text-stone uppercase">
          LoopScan → LoopBuild → LoopOps
        </p>
      </Container>
    </section>
  );
}
