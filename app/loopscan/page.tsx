import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/Button";
import { LoopScanForm } from "@/components/LoopScanForm";
import { Container, Eyebrow } from "@/components/Reveal";
import { company } from "@/lib/company";
import { cta, loopScanPage } from "@/lib/content";
import { routeMeta, routePageMeta } from "@/lib/seo";

export const metadata: Metadata = routePageMeta(routeMeta.loopscan);

export default function LoopScanPage() {
  return (
    <section className="py-16 md:py-24">
      <Container className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Eyebrow>LoopScan</Eyebrow>
          <h1 className="mt-5 text-4xl font-medium tracking-[-0.035em] text-ink md:text-5xl">
            {loopScanPage.headline}
          </h1>
          <div className="mt-8 space-y-7">
            {loopScanPage.sections.map((section) => (
              <div key={section.title}>
                <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-copper">
                  {section.title}
                </h2>
                <p className="mt-2 text-[16px] leading-7 text-ink">
                  {section.text}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Button href={cta.startLoopScan.href} location="loopscan_section">
              {cta.startLoopScan.label}
            </Button>
          </div>
          <p className="mt-8 text-[14px] leading-6 text-graphite">
            {loopScanPage.dataNote}{" "}
            <Link href="/security" className="text-copper hover:text-copper-dark">
              How we handle your data →
            </Link>
          </p>
          <p className="mt-4 text-[14px] leading-6 text-graphite">
            {company.contactEmail}
          </p>
          {company.phone ? (
            <p className="mt-1 text-[14px] leading-6 text-graphite">
              {company.phone}
            </p>
          ) : null}
        </div>
        <div id="intake" className="scroll-mt-24 lg:col-span-7">
          <LoopScanForm />
          <p className="mt-6 text-[12px] leading-6 text-stone">
            Do not include confidential drawings, proprietary formulas, customer
            data, passwords, or other sensitive information in this form. We put
            confidentiality in place before reviewing detailed information.
          </p>
        </div>
      </Container>
    </section>
  );
}
