import { Container, Eyebrow, Reveal } from "@/components/Reveal";
import { commercialJourney, loopScanOffer } from "@/lib/content";

export function CommercialPath() {
  return (
    <section className="border-y border-line bg-paper py-20 md:py-28">
      <Container>
        <Reveal>
          <Eyebrow>How we work with you</Eyebrow>
          <h2 className="mt-5 max-w-2xl text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
            Start with the work. Build what’s needed. Sustain what works.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-px border border-line bg-line md:grid-cols-3">
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
              {item.name === "LoopScan" ? (
                <p className="mt-4 text-[16px] font-medium text-ink">
                  {loopScanOffer.priceLine}
                </p>
              ) : null}
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
