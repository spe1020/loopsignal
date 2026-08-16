import type { Metadata } from "next";
import Link from "next/link";
import { LoopScanForm } from "@/components/LoopScanForm";
import { Container, Eyebrow } from "@/components/Reveal";
import { company } from "@/lib/company";
import { loopScanIntakeExamples, loopScanOffer, loopScanTeamHoursByRole } from "@/lib/content";
import { routeMeta, routePageMeta } from "@/lib/seo";

export const metadata: Metadata = routePageMeta(routeMeta.loopscan);

const nextSteps = [
  {
    step: "1",
    title: "We review the process",
    text: "We look at what you described and identify the questions worth exploring.",
  },
  {
    step: "2",
    title: "We understand the work",
    text: "If there is a fit, we talk through how the process works today, where the friction is, and what systems are involved.",
  },
  {
    step: "3",
    title: "We recommend the next step",
    text: loopScanOffer.credibleNextStep,
  },
];

export default function LoopScanPage() {
  const calendarUrl = process.env.CALENDAR_URL?.trim() || undefined;

  return (
    <>
      <section className="py-16 md:py-24">
        <Container className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Eyebrow>On-site operational review</Eyebrow>
            <h1 className="mt-5 text-4xl font-medium tracking-[-0.035em] text-ink md:text-5xl">
              {loopScanOffer.price}
            </h1>
            <p className="mt-3 text-[16px] leading-7 text-ink">
              {loopScanOffer.duration}. {loopScanOffer.findingsIn}.
            </p>
            <p className="mt-4 text-[15px] leading-7 text-graphite">
              {loopScanOffer.budgetLine}
            </p>
            <p className="mt-4 text-[15px] font-medium leading-7 text-ink">
              You get seven items:
            </p>
            <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-sm leading-5 text-ink">
              {loopScanOffer.deliverables.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
            <p className="mt-4 text-[15px] leading-7 text-ink">
              Your team: {loopScanOffer.teamHoursTotal}.
            </p>
            {loopScanTeamHoursByRole.length > 0 ? (
              <ul className="mt-1 space-y-1 text-[15px] leading-6 text-ink">
                {loopScanTeamHoursByRole.map((row) => (
                  <li key={row.role}>
                    {row.role}: {row.hours} hours
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-3 text-[15px] leading-7 text-ink">
              {loopScanOffer.guarantee}
            </p>
            <p className="mt-3 text-[15px] leading-7 text-ink">
              {loopScanOffer.radius}
            </p>
            <p className="mt-3 text-[15px] leading-6 text-graphite">
              {loopScanOffer.firstClient}
            </p>
            <p className="mt-3 text-[15px] leading-6 text-graphite">
              <a
                href={`mailto:${company.contactEmail}`}
                className="text-copper hover:text-copper-dark"
              >
                {company.contactEmail}
              </a>
            </p>
            <div className="mt-12 hidden lg:block">
              <h2 className="text-xl font-medium tracking-tight text-ink">
                What happens next?
              </h2>
              <ol className="mt-6 divide-y divide-line border-y border-line">
                {nextSteps.map((item) => (
                  <li key={item.step} className="py-5">
                    <p className="font-mono text-[11px] tracking-[0.16em] text-copper">
                      {item.step}
                    </p>
                    <h3 className="mt-2 text-[15px] font-medium text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-graphite">
                      {item.text}
                    </p>
                  </li>
                ))}
              </ol>
              <p className="mt-6 font-serif text-xl leading-snug text-ink">
                The goal is not to force AI into the process. The goal is to
                make the work better.
              </p>
            </div>
          </div>
          <div className="lg:col-span-7">
            <LoopScanForm calendarUrl={calendarUrl} />
            <p className="mt-6 text-[12px] leading-6 text-stone">
              Do not include confidential drawings, proprietary formulas,
              customer data, passwords, or other sensitive information in this
              form. We put confidentiality in place before reviewing detailed
              information.
            </p>
          </div>
        </Container>
      </section>

      <section className="border-t border-line bg-paper py-16 lg:hidden">
        <Container>
          <h2 className="text-xl font-medium tracking-tight text-ink">
            What happens next?
          </h2>
          <ol className="mt-6 divide-y divide-line border-y border-line">
            {nextSteps.map((item) => (
              <li key={item.step} className="py-5">
                <p className="font-mono text-[11px] tracking-[0.16em] text-copper">
                  {item.step}
                </p>
                <h3 className="mt-2 text-[15px] font-medium text-ink">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-graphite">
                  {item.text}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-6 font-serif text-xl leading-snug text-ink">
            The goal is not to force AI into the process. The goal is to make
            the work better.
          </p>
        </Container>
      </section>

      <section className="border-t border-line py-16 md:py-24">
        <Container>
          <h2 className="text-3xl font-medium tracking-[-0.03em] text-ink">
            Data
          </h2>
          <p className="mt-5 max-w-2xl text-[16px] leading-8 text-graphite">
            {loopScanOffer.dataHandling}{" "}
            <Link
              href="/security"
              className="text-copper hover:text-copper-dark"
            >
              How we handle data →
            </Link>
          </p>
        </Container>
      </section>

      <section className="border-t border-line py-16 md:py-24">
        <Container>
          <h2 className="text-3xl font-medium tracking-[-0.03em] text-ink">
            Not sure what to submit?
          </h2>
          <div className="mt-10 grid gap-px border border-line bg-line md:grid-cols-2">
            {loopScanIntakeExamples.map((example) => (
              <div key={example.area} className="bg-cream p-6 md:p-7">
                <p className="text-[12px] font-medium tracking-[0.04em] text-copper uppercase">
                  {example.area}
                </p>
                <p className="mt-3 text-[15px] leading-7 text-ink">
                  {example.text}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-8 font-serif text-xl text-ink md:text-2xl">
            If your team regularly says “there has to be a better way,” it is
            worth looking at.
          </p>
        </Container>
      </section>
    </>
  );
}
