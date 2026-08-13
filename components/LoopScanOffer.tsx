import { Button } from "@/components/Button";
import { Container, Eyebrow, Reveal } from "@/components/Reveal";
import {
  commercialJourney,
  loopScanFindings,
  loopScanSteps,
  services,
} from "@/lib/content";
import type { CtaLocation } from "@/lib/analytics";

const loopScan = services[0];

export function LoopScanOffer({
  ctaLocation = "loopscan_section",
}: {
  ctaLocation?: CtaLocation;
}) {
  return (
    <section className="border-y border-line bg-cream py-20 md:py-28">
      <Container>
        <Reveal>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-copper">
            Start here
          </p>
          <h2 className="mt-5 max-w-2xl text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
            Not sure where AI fits? Start with the work.
          </h2>
          <p className="mt-5 max-w-2xl text-[16px] leading-7 text-graphite">
            LoopScan is a focused operational review designed to identify where
            process improvement, AI, and automation can create measurable value.
          </p>
          <p className="mt-4 max-w-2xl text-[16px] leading-7 text-graphite">
            We follow the work, identify friction, and prioritize opportunities
            before recommending technology.
          </p>
          <div className="mt-8">
            <Button href="/loopscan" location={ctaLocation}>
              Start a LoopScan
            </Button>
          </div>
        </Reveal>

        <div className="mt-16 grid gap-px border border-line bg-line md:grid-cols-4">
          {loopScanSteps.map((step, index) => (
            <Reveal
              key={step.name}
              delay={index * 50}
              className="flex flex-col bg-cream p-6 md:min-h-[340px] md:p-7"
            >
              <span className="font-mono text-[11px] tracking-[0.16em] text-copper">
                {step.step}
              </span>
              <h3 className="mt-5 text-2xl font-medium tracking-tight text-ink">
                {step.name}
              </h3>
              <p className="mt-3 text-sm leading-6 text-graphite">
                {step.summary}
              </p>
              <ul className="mt-6 space-y-1.5">
                {step.points.map((point) => (
                  <li key={point} className="text-[13px] text-stone">
                    {point}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
        <p className="mt-4 text-center text-[12px] tracking-[0.16em] text-stone uppercase">
          Observe → Identify → Prioritize → Recommend
        </p>

        <div className="mt-20 grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <Eyebrow>What you leave with</Eyebrow>
            <h3 className="mt-5 text-3xl font-medium tracking-[-0.03em] text-ink md:text-[36px]">
              A clear roadmap. Not an AI wish list.
            </h3>
            <p className="mt-5 text-[16px] leading-7 text-graphite">
              The objective is not to find the most AI opportunities. It is to
              find the right operational problems to solve first.
            </p>
          </Reveal>
          <Reveal className="lg:col-span-7" delay={80}>
            <ul className="divide-y divide-line border-y border-line">
              {loopScan.deliverables.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 py-3.5 text-[15px] text-ink"
                >
                  <span className="mt-2.5 h-px w-3 shrink-0 bg-copper" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal className="mt-20 max-w-3xl">
          <h3 className="text-3xl font-medium tracking-[-0.03em] text-ink md:text-[36px]">
            A practical first step.
          </h3>
          <p className="mt-5 text-[16px] leading-7 text-graphite">
            LoopScan gives your team a structured way to explore AI and
            automation without committing to a major technology project.
          </p>
          <p className="mt-4 text-[16px] leading-7 text-graphite">
            If the assessment identifies a worthwhile opportunity, LoopWorks can
            help build it. If it does not, you still leave with a clearer
            understanding of your operation and where improvement opportunities
            exist.
          </p>
        </Reveal>

        <div className="mt-20">
          <Reveal>
            <Eyebrow>What might we find?</Eyebrow>
          </Reveal>
          <div className="mt-8 grid gap-px border border-line bg-line md:grid-cols-2">
            {loopScanFindings.map((finding, index) => (
              <Reveal
                key={finding.area}
                delay={index * 40}
                className="bg-cream p-6 md:p-7"
              >
                <p className="text-[12px] font-medium tracking-[0.04em] text-copper uppercase">
                  {finding.area}
                </p>
                <p className="mt-3 text-[15px] leading-7 text-ink">
                  {finding.text}
                </p>
              </Reveal>
            ))}
          </div>
          <p className="mt-8 font-serif text-xl text-ink md:text-2xl">
            The best first loop is usually already costing you time.
          </p>
        </div>

        <div className="mt-20">
          <Reveal>
            <p className="text-[12px] font-medium tracking-[0.16em] text-stone uppercase">
              How the work continues
            </p>
          </Reveal>
          <div className="mt-6 grid gap-px border border-line bg-line md:grid-cols-3">
            {commercialJourney.map((item, index) => (
              <Reveal
                key={item.name}
                delay={index * 50}
                className={`p-7 ${index === 0 ? "bg-paper" : "bg-cream"}`}
              >
                <p className="font-mono text-[11px] tracking-[0.16em] text-copper">
                  {item.step}
                </p>
                <h3 className="mt-4 text-xl font-medium tracking-tight text-ink">
                  {item.name}
                </h3>
                <p className="mt-3 text-[15px] leading-6 text-graphite">
                  {item.text}
                </p>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-[15px] text-graphite">
            Start small. Prove value. Expand from there.
          </p>
        </div>

        <Reveal className="mt-20 border-t border-line pt-16">
          <h3 className="max-w-2xl text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
            Find the first loop worth fixing.
          </h3>
          <p className="mt-5 max-w-xl text-[16px] leading-7 text-graphite">
            Tell us about a process that takes too long, requires too much
            manual work, depends on scattered information, or repeatedly causes
            problems.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Button href="/loopscan" location={ctaLocation}>
              Start a LoopScan
            </Button>
            <Button href="/loopscan" variant="text" location={ctaLocation}>
              Tell Us About the Process →
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
