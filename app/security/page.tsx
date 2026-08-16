import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/Reveal";
import { company } from "@/lib/company";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  path: "/security",
  title: "Security",
  description:
    "How LoopSignal handles operational data: read-only, only if you say yes, the smallest pull that answers the question, deleted when we are done.",
});

export default function SecurityPage() {
  return (
    <section className="border-b border-line py-20 md:py-28">
      <Container>
        <Eyebrow>Security and data</Eyebrow>
        <h1 className="mt-5 max-w-3xl text-4xl font-medium tracking-[-0.035em] text-ink md:text-6xl">
          We’re hired to look at your process. The data is yours.
        </h1>

        <div className="mt-12 max-w-2xl space-y-12">
          <div className="space-y-5 text-[16px] leading-8 text-graphite">
            <h2 className="text-2xl font-medium tracking-[-0.02em] text-ink">
              Most of a LoopScan doesn’t need your data
            </h2>
            <p>
              A LoopScan is two days on site, watching how work actually
              happens. That is where the findings come from.
            </p>
            <p>
              Some scans need a data pull to put a number on the problem. If
              yours does, we ask before anything is exported, and it is
              read-only — we do not write back to your systems.{" "}
              <strong className="font-medium text-ink">
                You can decline and still get the scan.
              </strong>
            </p>
            <p>
              We take the smallest pull that answers the question, and we tell
              you which fields that is before you send anything. Finding that
              37% of your open POs are past their expected date does not require
              your supplier names.
            </p>
          </div>

          <div className="space-y-5 text-[16px] leading-8 text-graphite">
            <h2 className="text-2xl font-medium tracking-[-0.02em] text-ink">
              If you do send data
            </h2>
            <p>
              It leaves your systems once, to the machine doing the analysis. It
              is not resold, not shared with anyone else, and not uploaded to a
              LoopSignal product.
            </p>
            <p>
              One person does this work. No team, no subcontractor, no offshore
              analyst, no shared drive.
            </p>
            <p>
              <strong className="font-medium text-ink">
                We delete our copy when the analysis that needed it is finished
                — and in no case later than 30 days after your readout.
              </strong>{" "}
              You get the raw pull and every query we ran against it, so you can
              reproduce any finding yourself.
            </p>
            <p>
              We keep the findings document and the summary numbers we measured
              — things like{" "}
              <em>“37% of open POs past expected date.”</em> That is what lets
              us show you what changed at month six, and what we would ask your
              written permission before referencing anywhere else. Your supplier
              names, part costs, and quality records are not in that.
            </p>
          </div>

          <div className="space-y-5 text-[16px] leading-8 text-graphite">
            <h2 className="text-2xl font-medium tracking-[-0.02em] text-ink">
              How we use AI
            </h2>
            <p>
              We use AI to do this work — outlining process, structuring
              analysis, drafting, writing code. Most of that is work about how
              we think, not about your rows.
            </p>
            <p>
              Where your data is involved, the control we give you is the ask:
              nothing is exported without your yes, we take the smallest pull
              that answers the question, and if you want to know which tools
              touch it, ask and you will get a straight answer instead of a
              policy page.
            </p>
          </div>

          <div className="space-y-5 text-[16px] leading-8 text-graphite">
            <h2 className="text-2xl font-medium tracking-[-0.02em] text-ink">
              If we build software for you
            </h2>
            <p>
              Built to your specification, on your systems, and yours to keep.
              If it needs cloud or backend infrastructure, you will know exactly
              what runs where, what it can reach, and who holds the keys —
              before it is built, not after.
            </p>
          </div>

          <div className="space-y-5 border border-line bg-paper p-7 text-[16px] leading-8 text-graphite md:p-9">
            <h2 className="text-2xl font-medium tracking-[-0.02em] text-ink">
              What we don’t promise
            </h2>
            <p>
              <strong className="font-medium text-ink">
                We are not SOC 2 certified, and we will not be this year.
              </strong>{" "}
              If your procurement process requires it, we are not your vendor
              yet — tell us on the first call and we will say so plainly instead
              of walking you through three meetings first.
            </p>
            <p>
              <strong className="font-medium text-ink">
                We do not have a sealed environment for AI analysis, so we are
                not going to claim one.
              </strong>{" "}
              If your data is part of an analysis, commercial tooling may be
              part of that analysis. Local hardware for exactly this is the next
              infrastructure we buy — but we would rather tell you what is true
              today than sell you a promise that is not running yet.
            </p>
            <p className="text-ink">
              What we do instead is tell you where your data is at every step,
              and give you the ability to stop any part of it.
            </p>
          </div>

          <p className="text-[16px] leading-8 text-graphite">
            Questions: {company.contactEmail}.
          </p>
        </div>
      </Container>
    </section>
  );
}
