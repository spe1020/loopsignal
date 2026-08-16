import type { Metadata } from "next";
import Link from "next/link";
import { LoopScanForm } from "@/components/LoopScanForm";
import { Container, Eyebrow } from "@/components/Reveal";
import { company } from "@/lib/company";
import {
  cta,
  loopScanIntakeExamples,
  loopScanOffer,
  loopScanTeamHoursByRole,
} from "@/lib/content";
import { routeMeta, routePageMeta } from "@/lib/seo";

export const metadata: Metadata = routePageMeta(routeMeta.loopscan);

export default function LoopScanPage() {
  const calendarUrl = process.env.CALENDAR_URL?.trim() || undefined;
  const startHref =
    calendarUrl ||
    `mailto:${company.contactEmail}?subject=${encodeURIComponent("Start a LoopScan")}`;

  return (
    <>
      <section className="py-16 md:py-24">
        <Container className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Eyebrow>LoopScan</Eyebrow>
            <h1 className="mt-5 text-4xl font-medium tracking-[-0.035em] text-ink md:text-5xl">
              Understand the process.
            </h1>
            <p className="mt-4 text-[15px] leading-6 text-graphite">
              {loopScanOffer.whatItIs}
            </p>
            <p className="mt-3 text-[15px] leading-6 text-graphite">
              {loopScanOffer.whatHappens}
            </p>
            <p className="mt-4 text-[13px] font-medium text-ink">
              What’s reviewed
            </p>
            <p className="mt-1 text-sm leading-5 text-graphite">
              {loopScanOffer.reviewed.join(" · ")}
            </p>
            <p className="mt-4 text-[13px] font-medium text-ink">
              What you receive
            </p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm leading-5 text-ink">
              {loopScanOffer.deliverables.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
            <p className="mt-5 text-[16px] leading-6 font-medium text-ink">
              {loopScanOffer.priceLine}
            </p>
            <p className="mt-2 text-[15px] leading-6 text-ink">
              Your team: {loopScanOffer.teamHoursTotal}
              {loopScanTeamHoursByRole.length > 0 ? "," : "."}
            </p>
            {loopScanTeamHoursByRole.length > 0 ? (
              <ul className="mt-1 space-y-0.5 text-sm leading-5 text-ink">
                {loopScanTeamHoursByRole.map((row) => (
                  <li key={row.role}>
                    {row.role}: {row.hours} hours
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-2 text-[15px] leading-6 text-ink">
              {loopScanOffer.radius}
            </p>
            <p className="mt-3 text-[14px] leading-6 text-graphite">
              {loopScanOffer.whyFixed}
            </p>
            <p className="mt-3 text-[15px] leading-6 text-ink">
              {loopScanOffer.guarantee}
            </p>
            <p className="mt-3 text-[14px] leading-6 text-graphite">
              {loopScanOffer.firstClient}
            </p>
            <div className="mt-4 border border-dashed border-line px-4 py-3">
              <p className="text-[11px] font-medium tracking-[0.14em] text-stone uppercase">
                Sample findings
              </p>
              <p className="mt-1 text-sm leading-5 text-graphite">
                Ungated sample PDF — slot reserved. File forthcoming.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <a
                href={startHref}
                className="inline-flex items-center justify-center rounded-[2px] bg-copper px-5 py-3 text-[13px] font-medium tracking-[0.02em] text-white transition-colors hover:bg-copper-dark"
              >
                {cta.startLoopScan.label}
              </a>
              <a
                href="#intake"
                className="text-[14px] font-medium tracking-[0.02em] text-graphite hover:text-ink"
              >
                {cta.talkThroughProcess.label} →
              </a>
            </div>
            <p className="mt-4 text-[15px] leading-6 text-graphite">
              <a
                href={`mailto:${company.contactEmail}`}
                className="text-copper hover:text-copper-dark"
              >
                {company.contactEmail}
              </a>
            </p>
          </div>
          <div id="intake" className="lg:col-span-7">
            <p className="mb-4 text-[12px] font-medium tracking-[0.04em] text-copper uppercase">
              Talk through a process
            </p>
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
        </Container>
      </section>
    </>
  );
}
