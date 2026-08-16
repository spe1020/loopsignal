"use client";

import { useEffect, useRef, useState } from "react";
import {
  trackLoopScanFormError,
  trackLoopScanFormStart,
  trackLoopScanFormSubmit,
  trackLoopScanPageView,
  trackScheduleClick,
} from "@/lib/analytics";
import { getLeadAttribution } from "@/lib/attribution";
import { company } from "@/lib/company";
import {
  cta,
  loopScanIntents,
  type LoopScanIntent,
} from "@/lib/content";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xeajkpoy";
const PROCESS_MIN_LENGTH = 20;

const timelines = ["Exploring", "Next quarter", "Active project"] as const;

type Timeline = (typeof timelines)[number];
type FieldName =
  | "intent"
  | "process"
  | "name"
  | "role"
  | "email"
  | "company"
  | "systems"
  | "timeline";

type FormState = {
  intent: LoopScanIntent;
  process: string;
  name: string;
  role: string;
  email: string;
  company: string;
  systems: string;
  timeline: Timeline | "";
};

type FieldErrors = Partial<Record<FieldName, string>>;

const emptyForm: FormState = {
  intent: "talk",
  process: "",
  name: "",
  role: "",
  email: "",
  company: "",
  systems: "",
  timeline: "",
};

const fieldOrder: FieldName[] = [
  "intent",
  "process",
  "name",
  "role",
  "email",
  "company",
  "systems",
  "timeline",
];

const INTENT_EVENT = "loopsignal:loopscan-intent";

function parseIntent(value: string | null | undefined): LoopScanIntent {
  return value === "book" ? "book" : "talk";
}

function intentLabel(intent: LoopScanIntent) {
  return loopScanIntents.find((item) => item.value === intent)?.label ?? "Want to talk through a process";
}

function writeIntentToUrl(intent: LoopScanIntent, hash?: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("intent", intent);
  if (hash) url.hash = hash;
  window.history.replaceState(
    {},
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}

const fieldClass =
  "w-full border bg-cream px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-stone/70 focus:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fieldId(name: FieldName) {
  return `loopscan-${name}`;
}

function errorId(name: FieldName) {
  return `loopscan-${name}-error`;
}

function validateField(name: FieldName, value: string): string | undefined {
  const trimmed = value.trim();

  switch (name) {
    case "process":
      if (trimmed.length === 0) {
        return "Please describe the process.";
      }
      if (trimmed.length < PROCESS_MIN_LENGTH) {
        return `Please add a bit more detail (at least ${PROCESS_MIN_LENGTH} characters).`;
      }
      return undefined;
    case "name":
      if (trimmed.length < 2) return "Please enter your name.";
      return undefined;
    case "role":
      if (trimmed.length < 2) return "Please enter your role or title.";
      return undefined;
    case "email":
      if (!emailPattern.test(trimmed)) {
        return "Please enter a valid work email.";
      }
      return undefined;
    case "company":
      if (trimmed.length < 2) return "Please enter your company.";
      return undefined;
    case "intent":
      if (trimmed !== "book" && trimmed !== "talk") {
        return "Please choose what brings you here.";
      }
      return undefined;
    case "systems":
      return undefined;
    case "timeline":
      if (trimmed && !timelines.includes(trimmed as Timeline)) {
        return "Please choose a timeline.";
      }
      return undefined;
  }
}

function validateForm(form: FormState): FieldErrors {
  const next: FieldErrors = {};
  for (const name of fieldOrder) {
    const error = validateField(name, form[name]);
    if (error) next[name] = error;
  }
  return next;
}

function formatLeadMessage(form: FormState, extra?: string[]) {
  const lines = [
    `Intent: ${intentLabel(form.intent)}`,
    "",
    "What process are we looking at?",
    form.process.trim(),
    "",
    `Name: ${form.name.trim()}`,
    `Role / title: ${form.role.trim()}`,
    `Email: ${form.email.trim()}`,
    `Company: ${form.company.trim()}`,
    `Primary systems in use: ${form.systems.trim() || "Not provided"}`,
    `Timeline: ${form.timeline || "Not provided"}`,
  ];

  if (extra && extra.length > 0) {
    lines.push("", ...extra);
  }

  return lines.join("\n");
}

function leadSubject(form: FormState) {
  return `LoopScan — ${intentLabel(form.intent)} — ${form.company.trim()}`;
}

function FieldError({ name, message }: { name: FieldName; message?: string }) {
  return (
    <p
      id={errorId(name)}
      aria-live="polite"
      className="min-h-[1.25rem] text-[12px] leading-5 text-copper"
    >
      {message ?? ""}
    </p>
  );
}

export function LoopScanForm({ calendarUrl }: { calendarUrl?: string }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const started = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const confirmHeadingRef = useRef<HTMLHeadingElement>(null);
  const failureHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    trackLoopScanPageView();
  }, []);

  useEffect(() => {
    function applyIntent(next: LoopScanIntent) {
      setForm((current) =>
        current.intent === next ? current : { ...current, intent: next },
      );
    }

    applyIntent(
      parseIntent(new URLSearchParams(window.location.search).get("intent")),
    );

    function onIntentEvent(event: Event) {
      const detail = (event as CustomEvent<LoopScanIntent>).detail;
      applyIntent(parseIntent(detail));
    }

    window.addEventListener(INTENT_EVENT, onIntentEvent);
    return () => window.removeEventListener(INTENT_EVENT, onIntentEvent);
  }, []);

  useEffect(() => {
    if (submitted) {
      confirmHeadingRef.current?.focus();
    }
  }, [submitted]);

  useEffect(() => {
    if (formError) {
      failureHeadingRef.current?.focus();
    }
  }, [formError]);

  function markStarted() {
    if (started.current) return;
    started.current = true;
    trackLoopScanFormStart();
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    markStarted();
    setForm((current) => ({ ...current, [key]: value }));
    setFormError("");
    setErrors((current) => {
      if (!current[key]) return current;
      const nextError = validateField(key, value);
      return { ...current, [key]: nextError };
    });
  }

  function onBlur(name: FieldName) {
    const error = validateField(name, form[name]);
    setErrors((current) => ({ ...current, [name]: error }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || submitted) return;

    const nextErrors = validateForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const firstInvalid = fieldOrder.find((name) => nextErrors[name]);
      if (firstInvalid) {
        document.getElementById(fieldId(firstInvalid))?.focus();
      }
      return;
    }

    setSubmitting(true);
    setFormError("");

    const honeypot = String(
      new FormData(event.currentTarget).get("company_website") ?? "",
    );

    if (honeypot.trim().length > 0) {
      setSubmitted(true);
      setSubmitting(false);
      return;
    }

    const attribution = getLeadAttribution();
    const attributionLines = [
      attribution.landingPage
        ? `Landing page: ${attribution.landingPage}`
        : "",
      attribution.referrer ? `Referrer: ${attribution.referrer}` : "",
      attribution.referringSource
        ? `Referring source: ${attribution.referringSource}`
        : "",
      attribution.utm.utm_source
        ? `UTM source: ${attribution.utm.utm_source}`
        : "",
      attribution.utm.utm_medium
        ? `UTM medium: ${attribution.utm.utm_medium}`
        : "",
      attribution.utm.utm_campaign
        ? `UTM campaign: ${attribution.utm.utm_campaign}`
        : "",
    ].filter(Boolean);

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _subject: leadSubject(form),
          _replyto: form.email.trim(),
          email: form.email.trim(),
          name: form.name.trim(),
          intent: intentLabel(form.intent),
          message: formatLeadMessage(form, attributionLines),
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
      } | null;

      if (!response.ok || payload?.ok === false) {
        setFormError(
          `We couldn’t send that just now. Try again, or email ${company.contactEmail} so this doesn’t get lost.`,
        );
        trackLoopScanFormError({ category: "server" });
        return;
      }

      trackLoopScanFormSubmit();
      setSubmitted(true);
    } catch {
      setFormError(
        `We couldn’t send that just now. Try again, or email ${company.contactEmail} so this doesn’t get lost.`,
      );
      trackLoopScanFormError({ category: "network" });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        className="border border-line bg-paper px-6 py-10 md:px-8 md:py-12"
        aria-live="polite"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-copper">
          Received
        </p>
        <h2
          ref={confirmHeadingRef}
          tabIndex={-1}
          className="mt-4 text-3xl font-medium tracking-tight text-ink outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          We’ve got it.
        </h2>
        <p className="mt-4 max-w-md text-[15px] leading-7 text-graphite">
          Thanks for sharing the process. We’ll review what you described and
          follow up with a few initial thoughts.
        </p>
        <p className="mt-4 max-w-md text-[15px] leading-7 text-graphite">
          We reply within two business days.
        </p>
        <ol className="mt-8 divide-y divide-line border-y border-line">
          <li className="py-4">
            <p className="font-mono text-[11px] tracking-[0.16em] text-copper">
              1
            </p>
            <p className="mt-1 text-[15px] font-medium text-ink">
              We review the process
            </p>
            <p className="mt-1 text-sm leading-6 text-graphite">
              We look at what you described and identify the questions worth
              exploring.
            </p>
          </li>
          <li className="py-4">
            <p className="font-mono text-[11px] tracking-[0.16em] text-copper">
              2
            </p>
            <p className="mt-1 text-[15px] font-medium text-ink">
              We follow up
            </p>
            <p className="mt-1 text-sm leading-6 text-graphite">
              If there is a fit, we’ll ask a few clarifying questions
              about how the work happens today.
            </p>
          </li>
          <li className="py-4">
            <p className="font-mono text-[11px] tracking-[0.16em] text-copper">
              3
            </p>
            <p className="mt-1 text-[15px] font-medium text-ink">
              We recommend a next step
            </p>
            <p className="mt-1 text-sm leading-6 text-graphite">
              Sometimes a process change. Sometimes a LoopScan. Sometimes no
              technology at all.
            </p>
          </li>
        </ol>
        {calendarUrl ? (
          <div className="mt-10 border-t border-line pt-8">
            <h3 className="text-lg font-medium tracking-tight text-ink">
              Want to talk it through?
            </h3>
            <p className="mt-3 text-[15px] leading-7 text-graphite">
              If you’d rather walk through the process together, schedule a
              short conversation.
            </p>
            <a
              href={calendarUrl}
              onClick={() => trackScheduleClick()}
              className="mt-6 inline-flex items-center justify-center rounded-[2px] bg-copper px-6 py-3.5 text-[14px] font-medium tracking-[0.02em] text-white transition-colors hover:bg-copper-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Schedule a 20-Minute Conversation
            </a>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className="relative grid gap-1"
      aria-busy={submitting}
    >
      <input
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      />

      {formError ? (
        <div
          role="alert"
          className="mb-4 border border-copper bg-copper-soft px-5 py-5"
        >
          <h2
            ref={failureHeadingRef}
            tabIndex={-1}
            className="text-lg font-medium tracking-tight text-ink outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            We couldn’t send this.
          </h2>
          <p className="mt-2 text-sm leading-6 text-graphite">{formError}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-[2px] bg-copper px-5 py-2.5 text-[13px] font-medium tracking-[0.02em] text-white transition-colors hover:bg-copper-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-70"
            >
              Try again
            </button>
          </div>
        </div>
      ) : null}

      <fieldset className="grid gap-2">
        <legend className="text-[12px] font-medium text-graphite">
          What brings you here?
        </legend>
        <div className="grid gap-2">
          {loopScanIntents.map((item) => (
            <label
              key={item.value}
              className="flex cursor-pointer items-start gap-3 border border-line bg-cream px-4 py-3 text-sm text-ink"
            >
              <input
                type="radio"
                name="intent"
                value={item.value}
                checked={form.intent === item.value}
                onChange={() => {
                  update("intent", item.value);
                  writeIntentToUrl(item.value);
                }}
                className="mt-0.5 accent-copper"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
        <FieldError name="intent" message={errors.intent} />
      </fieldset>

      <div className="grid gap-2">
        <label
          htmlFor={fieldId("process")}
          className="text-[12px] font-medium text-graphite"
        >
          What process are we looking at?
        </label>
        <textarea
          id={fieldId("process")}
          name="process"
          rows={6}
          value={form.process}
          onChange={(event) => update("process", event.target.value)}
          onBlur={() => onBlur("process")}
          placeholder="e.g. a workflow that takes too long, information that’s hard to find, or decisions that happen too late"
          required
          aria-invalid={Boolean(errors.process)}
          aria-describedby={errors.process ? errorId("process") : undefined}
          className={`${fieldClass} min-h-[140px] resize-y ${errors.process ? "border-copper" : "border-line"}`}
        />
        <FieldError name="process" message={errors.process} />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor={fieldId("name")}
          className="text-[12px] font-medium text-graphite"
        >
          Name
        </label>
        <input
          id={fieldId("name")}
          name="name"
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          onBlur={() => onBlur("name")}
          autoComplete="name"
          required
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? errorId("name") : undefined}
          className={`${fieldClass} ${errors.name ? "border-copper" : "border-line"}`}
        />
        <FieldError name="name" message={errors.name} />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor={fieldId("role")}
          className="text-[12px] font-medium text-graphite"
        >
          Role / title
        </label>
        <input
          id={fieldId("role")}
          name="role"
          value={form.role}
          onChange={(event) => update("role", event.target.value)}
          onBlur={() => onBlur("role")}
          autoComplete="organization-title"
          required
          aria-invalid={Boolean(errors.role)}
          aria-describedby={errors.role ? errorId("role") : undefined}
          className={`${fieldClass} ${errors.role ? "border-copper" : "border-line"}`}
          placeholder="e.g. Procurement Manager"
        />
        <FieldError name="role" message={errors.role} />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor={fieldId("email")}
          className="text-[12px] font-medium text-graphite"
        >
          Work Email
        </label>
        <input
          id={fieldId("email")}
          type="email"
          name="email"
          value={form.email}
          onChange={(event) => update("email", event.target.value)}
          onBlur={() => onBlur("email")}
          autoComplete="email"
          inputMode="email"
          required
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? errorId("email") : undefined}
          className={`${fieldClass} ${errors.email ? "border-copper" : "border-line"}`}
        />
        <FieldError name="email" message={errors.email} />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor={fieldId("company")}
          className="text-[12px] font-medium text-graphite"
        >
          Company
        </label>
        <input
          id={fieldId("company")}
          name="company"
          value={form.company}
          onChange={(event) => update("company", event.target.value)}
          onBlur={() => onBlur("company")}
          autoComplete="organization"
          required
          aria-invalid={Boolean(errors.company)}
          aria-describedby={errors.company ? errorId("company") : undefined}
          className={`${fieldClass} ${errors.company ? "border-copper" : "border-line"}`}
        />
        <FieldError name="company" message={errors.company} />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor={fieldId("systems")}
          className="text-[12px] font-medium text-graphite"
        >
          Primary systems in use{" "}
          <span className="font-normal text-stone">(optional)</span>
        </label>
        <input
          id={fieldId("systems")}
          name="systems"
          value={form.systems}
          onChange={(event) => update("systems", event.target.value)}
          onBlur={() => onBlur("systems")}
          placeholder="e.g. Epicor, Excel, shared drives"
          aria-invalid={Boolean(errors.systems)}
          aria-describedby={errors.systems ? errorId("systems") : undefined}
          className={`${fieldClass} ${errors.systems ? "border-copper" : "border-line"}`}
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor={fieldId("timeline")}
          className="text-[12px] font-medium text-graphite"
        >
          Timeline <span className="font-normal text-stone">(optional)</span>
        </label>
        <select
          id={fieldId("timeline")}
          name="timeline"
          value={form.timeline}
          onChange={(event) =>
            update("timeline", event.target.value as FormState["timeline"])
          }
          onBlur={() => onBlur("timeline")}
          aria-invalid={Boolean(errors.timeline)}
          aria-describedby={errors.timeline ? errorId("timeline") : undefined}
          className={`${fieldClass} ${form.timeline ? "text-ink" : "text-stone/70"} ${errors.timeline ? "border-copper" : "border-line"}`}
        >
          <option value="">Select a timeline</option>
          {timelines.map((timeline) => (
            <option key={timeline} value={timeline}>
              {timeline}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={submitting || submitted}
        className="mt-3 inline-flex items-center justify-center gap-2 rounded-[2px] bg-copper px-6 py-3.5 text-[14px] font-medium tracking-[0.02em] text-white transition-colors hover:bg-copper-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? (
          <>
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
              aria-hidden="true"
            />
            Sending
          </>
        ) : (
          "Send this process"
        )}
      </button>
      <p className="mt-4 text-[13px] leading-6 text-stone">
        Start with the problem. We’ll figure out the technology later.
      </p>
    </form>
  );
}

export function LoopScanCtas() {
  function selectIntent(intent: LoopScanIntent) {
    writeIntentToUrl(intent, "intake");
    window.dispatchEvent(
      new CustomEvent<LoopScanIntent>(INTENT_EVENT, { detail: intent }),
    );
    document.getElementById("intake")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-4">
      <a
        href="/loopscan?intent=book#intake"
        onClick={(event) => {
          event.preventDefault();
          selectIntent("book");
        }}
        className="inline-flex items-center justify-center rounded-[2px] bg-copper px-5 py-3 text-[13px] font-medium tracking-[0.02em] text-white transition-colors hover:bg-copper-dark"
      >
        {cta.startLoopScan.label}
      </a>
      <a
        href="/loopscan?intent=talk#intake"
        onClick={(event) => {
          event.preventDefault();
          selectIntent("talk");
        }}
        className="text-[14px] font-medium tracking-[0.02em] text-graphite hover:text-ink"
      >
        {cta.talkThroughProcess.label} →
      </a>
    </div>
  );
}
