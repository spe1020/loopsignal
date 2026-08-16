import type { Metadata } from "next";
import Link from "next/link";
import { CalBooking } from "@/components/CalBooking";
import { LoopScanCtas, LoopScanForm } from "@/components/LoopScanForm";
import { Container, Eyebrow } from "@/components/Reveal";
import { FIT_CHECK_SECTION_ID, getCalLoopScanUrl } from "@/lib/cal";
import { company } from "@/lib/company";
import {
  loopScanEngagementSteps,
  loopScanFit,
  loopScanFitCheck,
  loopScanIntakeExamples,
  loopScanOffer,
  loopScanTeamHoursByRole,
} from "@/lib/content";
import { routeMeta, routePageMeta } from "@/lib/seo";

export const metadata: Metadata = routePageMeta(routeMeta.loopscan);

export default function LoopScanPage() {
  const bookingUrl = getCalLoopScanUrl();

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
            <p className="mt-5 border border-line bg-paper px-4 py-3 text-[15px] leading-6 text-ink">
              {loopScanOffer.declineThePull}
            </p>
            <ol className="mt-5 flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-sm leading-5 text-ink">
              {loopScanEngagementSteps.map((step, index) => (
                <li key={step} className="flex items-baseline gap-1.5">
                  {index > 0 ? (
                    <span className="text-stone" aria-hidden="true">
                      →
                    </span>
                  ) : null}
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-[16px] leading-6 font-medium text-ink">
              {loopScanOffer.priceLine}
            </p>
            <p className="mt-3 text-[15px] font-medium leading-6 text-ink">
              {loopScanOffer.whyFixedTitle}
            </p>
            <p className="mt-1 text-[14px] leading-6 text-graphite">
              {loopScanOffer.whyFixed}
            </p>
            <LoopScanCtas />
            <div className="mt-6 border border-dashed border-line px-4 py-3">
              <p className="text-[11px] font-medium tracking-[0.14em] text-stone uppercase">
                {loopScanOffer.samplePdf.eyebrow}
              </p>
              <p className="mt-1 text-sm leading-5 text-graphite">
                {loopScanOffer.samplePdf.body}
              </p>
              <a
                href={loopScanOffer.samplePdf.href}
                download={loopScanOffer.samplePdf.filename}
                className="mt-2 inline-block text-sm font-medium text-copper hover:text-copper-dark"
              >
                {loopScanOffer.samplePdf.cta} →
              </a>
            </div>
            <p className="mt-4 text-[15px] leading-6 text-ink">
              Your team:{" "}
              {loopScanTeamHoursByRole
                .map((row) => `${row.role} ${row.hours}`)
                .join(" · ")}
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
            <p className="mt-5 text-[15px] leading-6 text-graphite">
              {loopScanOffer.afterLoopScan.beforeLink}
              <a
                href={loopScanOffer.samplePdf.href}
                download={loopScanOffer.samplePdf.filename}
                className="font-medium text-copper hover:text-copper-dark"
              >
                {loopScanOffer.afterLoopScan.link}
              </a>
              {loopScanOffer.afterLoopScan.afterLink}
            </p>
            <p className="mt-5 text-[15px] leading-6 text-ink">
              {loopScanOffer.travel}
            </p>
            <p className="mt-3 text-[15px] leading-6 text-ink">
              {loopScanOffer.guarantee}
            </p>
            <p className="mt-3 text-[14px] leading-6 text-graphite">
              {loopScanOffer.firstClient}
            </p>
            <p className="mt-4 text-[13px] font-medium text-ink">Your data</p>
            <p className="mt-1 text-[14px] leading-6 text-graphite">
              {loopScanOffer.dataHandling}{" "}
              <Link
                href="/security"
                className="text-copper hover:text-copper-dark"
              >
                How we handle your data →
              </Link>
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-[13px] font-medium text-ink">
                  {loopScanFit.good.title}
                </p>
                <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-5 text-graphite">
                  {loopScanFit.good.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[13px] font-medium text-ink">
                  {loopScanFit.not.title}
                </p>
                <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-5 text-graphite">
                  {loopScanFit.not.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-4 text-[15px] leading-6 text-graphite">
              {company.contactEmail}
            </p>
            {company.phone ? (
              <p className="mt-1 text-[15px] leading-6 text-graphite">
                {company.phone}
              </p>
            ) : null}
          </div>
          <div id="intake" className="scroll-mt-24 lg:col-span-7">
            <LoopScanForm bookingUrl={bookingUrl} />
            <p className="mt-6 text-[12px] leading-6 text-stone">
              Do not include confidential drawings, proprietary formulas,
              customer data, passwords, or other sensitive information in this
              form. We put confidentiality in place before reviewing detailed
              information.
            </p>
          </div>
        </Container>
      </section>

      <section
        id={FIT_CHECK_SECTION_ID}
        className="scroll-mt-24 border-t border-line bg-paper py-16 md:py-24"
      >
        <Container>
          <Eyebrow>{loopScanFitCheck.eyebrow}</Eyebrow>
          <h2 className="mt-5 max-w-3xl text-3xl font-medium tracking-[-0.03em] text-ink md:text-[40px]">
            {loopScanFitCheck.headline}
          </h2>
          <p className="mt-5 max-w-2xl text-[16px] leading-8 text-graphite">
            {loopScanFitCheck.body}
          </p>
          <div className="mt-10 grid gap-px border border-line bg-line md:grid-cols-3">
            {loopScanFitCheck.expectations.map((item) => (
              <div key={item.title} className="bg-cream p-6 md:p-7">
                <h3 className="text-[16px] font-medium tracking-tight text-ink">
                  {item.title}
                </h3>
                <p className="mt-3 text-[15px] leading-7 text-graphite">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-12 min-w-0">
            <CalBooking namespace="loopscan" bookingUrl={bookingUrl} />
          </div>
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
