import { Button } from "@/components/Button";
import { Container, Eyebrow, Reveal } from "@/components/Reveal";
import { commercialJourney, cta, services } from "@/lib/content";
import type { CtaLocation } from "@/lib/analytics";

const loopBuild = services[1];

export function CommercialPath({
  ctaLocation = "loopscan_section",
  showLoopBuildDetail = true,
}: {
  ctaLocation?: CtaLocation;
  showLoopBuildDetail?: boolean;
}) {
  return (
    <section className="border-y border-line bg-paper py-20 md:py-28">
      <Container>
        <Reveal>
          <Eyebrow>How we work with you</Eyebrow>
          <h2 className="mt-5 max-w-2xl text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
            Start with the work. Build what is needed.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-px border border-line bg-line md:grid-cols-2">
          {commercialJourney.map((item, index) => (
            <Reveal
              key={item.name}
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
              <p className="mt-3 text-[15px] leading-6 text-graphite">
                {item.text}
              </p>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-center text-[12px] tracking-[0.16em] text-stone uppercase">
          LoopScan → LoopBuild
        </p>

        {showLoopBuildDetail ? (
          <div className="mt-16 grid gap-12 border-t border-line pt-16 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <p className="text-[12px] font-medium tracking-[0.04em] text-copper uppercase">
                {loopBuild.name}
              </p>
              <h3 className="mt-4 text-3xl font-medium tracking-[-0.03em] text-ink md:text-[36px]">
                {loopBuild.headline}
              </h3>
              <p className="mt-5 text-[16px] leading-7 text-graphite">
                {loopBuild.detail}
              </p>
              <div className="mt-8">
                <Button href={cta.primary.href} location={ctaLocation}>
                  {cta.primary.label}
                </Button>
              </div>
            </Reveal>
            <Reveal className="lg:col-span-7" delay={80}>
              <ul className="grid gap-px border border-line bg-line sm:grid-cols-2">
                {loopBuild.deliverables.map((item) => (
                  <li
                    key={item}
                    className="bg-cream px-5 py-4 text-[15px] text-ink"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        ) : (
          <Reveal className="mt-10">
            <Button href={cta.primary.href} location={ctaLocation}>
              {cta.primary.label}
            </Button>
          </Reveal>
        )}
      </Container>
    </section>
  );
}
