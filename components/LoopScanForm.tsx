"use client";

import { useEffect, useRef, useState } from "react";
import {
  trackLoopScanFormError,
  trackLoopScanFormStart,
  trackLoopScanFormSubmit,
  trackLoopScanPageView,
} from "@/lib/analytics";
import { getLeadAttribution } from "@/lib/attribution";
import { company } from "@/lib/company";
import { loopScanForm as defaultForm } from "@/lib/content";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xeajkpoy";

type FieldName = "name" | "company" | "role" | "contact" | "slowing";

type FormState = Record<FieldName, string>;

type FieldErrors = Partial<Record<FieldName, string>>;

const emptyForm: FormState = {
  name: "",
  company: "",
  role: "",
  contact: "",
  slowing: "",
};

const fieldOrder: FieldName[] = ["name", "company", "role", "contact", "slowing"];

const fieldClass =
  "w-full border bg-cream px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-stone/70 focus:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmail(value: string) {
  return emailPattern.test(value.trim());
}

function isPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 && /^[\d\s()+.\-]+$/.test(value.trim());
}

function fieldId(name: FieldName) {
  return `loopscan-${name}`;
}

function errorId(name: FieldName) {
  return `loopscan-${name}-error`;
}

function validateField(name: FieldName, value: string): string | undefined {
  const trimmed = value.trim();

  switch (name) {
    case "name":
      if (trimmed.length < 2) return "Please enter your name.";
      return undefined;
    case "company":
      if (trimmed.length < 2) return "Please enter your company.";
      return undefined;
    case "role":
      if (trimmed.length < 2) return "Please enter your role.";
      return undefined;
    case "contact":
      if (!isEmail(trimmed) && !isPhone(trimmed)) {
        return "Please enter an email address or phone number.";
      }
      return undefined;
    case "slowing":
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
    `Name: ${form.name.trim()}`,
    `Company: ${form.company.trim()}`,
    `Role: ${form.role.trim()}`,
    `Email or phone: ${form.contact.trim()}`,
    "",
    `${defaultForm.fields.slowing}`,
    form.slowing.trim() || "Not provided",
  ];

  if (extra && extra.length > 0) {
    lines.push("", ...extra);
  }

  return lines.join("\n");
}

function leadSubject(form: FormState) {
  return `LoopScan — ${form.company.trim()}`;
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

export function LoopScanForm({ intent = "loopscan" }: { intent?: "loopscan" | "pilot" }) {
  const loopScanForm = intent === "pilot" ? { ...defaultForm, eyebrow: "Join the pilot", heading: "Tell us about your team.", submit: "Join the pilot", successHeadline: "Thanks — your pilot interest has been received. We’ll be in touch.", slowingPlaceholder: "e.g. quality investigations and action updates scattered across shifts" } : defaultForm;
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const started = useRef(false);
  const confirmHeadingRef = useRef<HTMLHeadingElement>(null);
  const failureHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    trackLoopScanPageView();
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

  function update(key: FieldName, value: string) {
    markStarted();
    setForm((current) => ({ ...current, [key]: value }));
    setFormError("");
    setErrors((current) => {
      if (!current[key]) return current;
      return { ...current, [key]: validateField(key, value) };
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

    const contact = form.contact.trim();
    const contactIsEmail = isEmail(contact);

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _subject: intent === "pilot" ? `LoopSignal software pilot — ${form.company.trim()}` : leadSubject(form),
          ...(contactIsEmail ? { _replyto: contact, email: contact } : { phone: contact }),
          name: form.name.trim(),
          company: form.company.trim(),
          role: form.role.trim(),
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
          className="mt-4 text-2xl font-medium tracking-tight text-ink outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:text-3xl"
        >
          {loopScanForm.successHeadline}
        </h2>
      </div>
    );
  }

  return (
    <form
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

      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-copper">
        {loopScanForm.eyebrow}
      </p>
      <h2 className="mt-2 mb-5 text-2xl font-medium tracking-tight text-ink">
        {loopScanForm.heading}
      </h2>

      {formError ? (
        <div
          role="alert"
          className="mb-4 border border-copper bg-copper-soft px-5 py-5"
        >
          <h3
            ref={failureHeadingRef}
            tabIndex={-1}
            className="text-lg font-medium tracking-tight text-ink outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            We couldn’t send this.
          </h3>
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

      <div className="grid gap-2">
        <label
          htmlFor={fieldId("name")}
          className="text-[12px] font-medium text-graphite"
        >
          {loopScanForm.fields.name}
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
          htmlFor={fieldId("company")}
          className="text-[12px] font-medium text-graphite"
        >
          {loopScanForm.fields.company}
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
          htmlFor={fieldId("role")}
          className="text-[12px] font-medium text-graphite"
        >
          {loopScanForm.fields.role}
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
          placeholder="e.g. Plant Manager"
        />
        <FieldError name="role" message={errors.role} />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor={fieldId("contact")}
          className="text-[12px] font-medium text-graphite"
        >
          {loopScanForm.fields.contact}
        </label>
        <input
          id={fieldId("contact")}
          name="contact"
          value={form.contact}
          onChange={(event) => update("contact", event.target.value)}
          onBlur={() => onBlur("contact")}
          autoComplete="email"
          inputMode="email"
          required
          aria-invalid={Boolean(errors.contact)}
          aria-describedby={errors.contact ? errorId("contact") : undefined}
          className={`${fieldClass} ${errors.contact ? "border-copper" : "border-line"}`}
        />
        <FieldError name="contact" message={errors.contact} />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor={fieldId("slowing")}
          className="text-[12px] font-medium text-graphite"
        >
          {loopScanForm.fields.slowing}{" "}
          <span className="font-normal text-stone">(optional)</span>
        </label>
        <textarea
          id={fieldId("slowing")}
          name="slowing"
          rows={4}
          value={form.slowing}
          onChange={(event) => update("slowing", event.target.value)}
          placeholder={loopScanForm.slowingPlaceholder}
          className={`${fieldClass} min-h-[110px] resize-y border-line`}
        />
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
          loopScanForm.submit
        )}
      </button>
    </form>
  );
}
