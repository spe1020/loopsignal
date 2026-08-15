import Link from "next/link";
import { PlantStatusBadge, Pill } from "@/components/brief/BriefBadges";
import { SectionLabel, consoleBtn } from "@/components/brief/BriefPanels";
import {
  EMAIL_SENDING_ENABLED,
  demoSchedules,
  executiveGroup,
} from "@/lib/brief/delivery";
import type { BuiltReport } from "@/lib/brief/reports";
import type { BriefResult, ReportKind } from "@/lib/brief/types";
import { reportKindLabels, reportKinds } from "@/lib/brief/types";
import type { ExecutiveEmail } from "@/lib/brief/delivery";

export function ReportPicker({
  active,
  onSelect,
}: {
  active: ReportKind;
  onSelect: (kind: ReportKind) => void;
}) {
  return (
    <div className="border border-[#d9d9d2] bg-white px-4 py-3 md:px-5">
      <SectionLabel>Reports</SectionLabel>
      <p className="mt-1 text-[12px] text-graphite">
        Deterministic briefs from the current LoopBrief signals. No AI API is
        used.
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {reportKinds.map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => onSelect(kind)}
            className={`${consoleBtn} ${active === kind ? "border-ink" : ""}`}
          >
            {reportKindLabels[kind]}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReportView({
  brief,
  report,
  onCopy,
  copied,
}: {
  brief: BriefResult;
  report: BuiltReport;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <section className="border border-[#d9d9d2] bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#d9d9d2] px-4 py-4 md:px-5">
        <div>
          <SectionLabel>{report.kind === "executive" ? "Leadership" : "Department"}</SectionLabel>
          <h2 className="mt-2 text-[22px] font-medium tracking-tight text-ink">
            {report.title}
          </h2>
          <p className="mt-1 text-[12px] text-graphite">{report.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PlantStatusBadge status={brief.plantStatus.status} />
          <button type="button" onClick={onCopy} className={consoleBtn}>
            {copied ? "Copied" : report.kind === "executive" ? "Copy Executive Brief" : "Copy Department Brief"}
          </button>
        </div>
      </div>
      <p className="border-b border-[#ecece6] px-4 py-3 text-[13px] font-medium text-ink md:px-5">
        {report.statusLine}
      </p>
      <div className="space-y-5 px-4 py-4 md:px-5">
        {report.sections.map((section) => (
          <div key={section.heading}>
            <h3 className="text-[13px] font-medium tracking-tight text-ink">
              {section.heading}
            </h3>
            {section.body ? (
              <p className="mt-1 text-[13px] leading-6 text-graphite">{section.body}</p>
            ) : null}
            {section.bullets?.length ? (
              <ul className="mt-2 space-y-1.5">
                {section.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="border-l-2 border-[#d9d9d2] pl-3 text-[13px] leading-6 text-graphite"
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function ExecutiveEmailPreview({
  email,
  onCopy,
  copied,
}: {
  email: ExecutiveEmail;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <section className="border border-[#d9d9d2] bg-white px-4 py-4 md:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <SectionLabel>Preview Executive Email</SectionLabel>
          <p className="mt-1 text-[12px] text-graphite">
            Prepared copy only. The public demo does not send email.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onCopy} className={consoleBtn}>
            {copied ? "Copied" : "Copy Email"}
          </button>
          <button type="button" disabled className={`${consoleBtn} opacity-60`}>
            Send Executive Brief · Demo
          </button>
        </div>
      </div>
      <p className="mt-3 text-[12px] font-medium text-ink">
        Subject: {email.subject}
      </p>
      <pre className="mt-3 whitespace-pre-wrap border border-[#ecece6] bg-[#fafaf7] px-3 py-3 font-sans text-[13px] leading-6 text-graphite">
        {email.body}
      </pre>
      <p className="mt-3 text-[12px]">
        <Link href="#demo" className="font-medium text-copper hover:text-copper-dark">
          View Full LoopBrief
        </Link>
      </p>
      {EMAIL_SENDING_ENABLED ? null : (
        <p className="mt-2 text-[11px] text-stone">
          Future sending would go through a server-side provider. Credentials
          are never stored in the browser.
        </p>
      )}
    </section>
  );
}

export function DistributionAndSchedule() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="border border-[#d9d9d2] bg-white px-4 py-4 md:px-5">
        <SectionLabel>Executive Group</SectionLabel>
        <p className="mt-1 text-[12px] text-graphite">
          Fictional reporting group. Role names only — no real people.
        </p>
        <ul className="mt-3 divide-y divide-[#ecece6] border-y border-[#ecece6]">
          {executiveGroup.roles.map((role) => (
            <li key={role.role} className="flex items-baseline justify-between gap-3 py-2">
              <span className="text-[13px] text-ink">{role.role}</span>
              <span className="font-mono text-[11px] text-stone">{role.address}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="border border-[#d9d9d2] bg-white px-4 py-4 md:px-5">
        <SectionLabel>Reporting Schedule</SectionLabel>
        <p className="mt-1 text-[12px] text-graphite">
          Demo configuration. Nothing is scheduled or sent.
        </p>
        <ul className="mt-3 space-y-2">
          {demoSchedules.map((item) => (
            <li key={item.id} className="border border-[#ecece6] px-3 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[13px] font-medium text-ink">{item.name}</p>
                <Pill>Demo Configuration</Pill>
              </div>
              <p className="mt-1 text-[12px] text-graphite">
                {item.frequency} · {item.delivery} · {item.recipients}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function OperatingLoop() {
  const steps = ["Signal", "Brief", "Assign", "Act", "Verify", "Improve"];
  return (
    <section className="border border-[#d9d9d2] bg-white px-4 py-4 md:px-5">
      <SectionLabel>LoopBrief operating loop</SectionLabel>
      <ol className="mt-3 flex flex-wrap items-center gap-2 text-[12px] font-medium text-ink">
        {steps.map((step, index) => (
          <li key={step} className="flex items-center gap-2">
            <span className="border border-[#c8c8c0] bg-[#fafaf7] px-2 py-1">
              {step}
            </span>
            {index < steps.length - 1 ? (
              <span aria-hidden className="text-stone">
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ActionMessage() {
  return (
    <section className="border border-[#d9d9d2] bg-[#fafaf7] px-4 py-4 md:px-5">
      <SectionLabel>Reporting is only useful if it creates action.</SectionLabel>
      <p className="mt-2 max-w-2xl text-[13px] leading-6 text-graphite">
        LoopBrief connects operational signals to the people or systems
        responsible for doing something about them.
      </p>
      <p className="mt-3 text-[14px] font-medium tracking-tight text-ink">
        See it. Assign it. Close the loop.
      </p>
    </section>
  );
}
