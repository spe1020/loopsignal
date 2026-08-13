"use client";

import { useEffect, useRef, useState } from "react";
import { getUtmParams, track } from "@/lib/analytics";
import { loopScanAreas } from "@/lib/content";

const fieldClass =
  "w-full border bg-cream px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-stone/70 focus:border-ink";

type FormState = {
  name: string;
  company: string;
  email: string;
  area: string;
  process: string;
};

const emptyForm: FormState = {
  name: "",
  company: "",
  email: "",
  area: "",
  process: "",
};

export function LoopScanForm({ calendarUrl }: { calendarUrl?: string }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    track("loopscan_page_view", getUtmParams());
  }, []);

  function markStarted() {
    if (started.current) return;
    started.current = true;
    track("loopscan_form_start");
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    markStarted();
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError("");
  }

  function validate() {
    const next: Partial<FormState> = {};
    if (form.name.trim().length < 2) next.name = "Please enter your name.";
    if (form.company.trim().length < 2) {
      next.company = "Please enter your company.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Please enter a valid work email.";
    }
    if (!loopScanAreas.includes(form.area as (typeof loopScanAreas)[number])) {
      next.area = "Please choose an area.";
    }
    if (form.process.trim().length < 8) {
      next.process = "Please describe the process you’d like to improve.";
    }
    return next;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || submitted) return;

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFormError("Please check the highlighted fields.");
      track("loopscan_form_error", { reason: "validation" });
      return;
    }

    setSubmitting(true);
    setFormError("");

    const honeypot = String(
      new FormData(event.currentTarget).get("company_website") ?? "",
    );

    try {
      const response = await fetch("/api/loopscan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          company: form.company.trim(),
          email: form.email.trim(),
          area: form.area,
          process: form.process.trim(),
          submittedAt: new Date().toISOString(),
          referrer: document.referrer || undefined,
          landingPage: window.location.href,
          utm: getUtmParams(),
          company_website: honeypot,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setFormError(
          payload.error ??
            "We couldn’t send that just now. Please try again in a moment.",
        );
        track("loopscan_form_error", { reason: "server" });
        return;
      }

      track("loopscan_form_submit", { area: form.area });
      setSubmitted(true);
    } catch {
      setFormError(
        "We couldn’t send that just now. Please try again in a moment.",
      );
      track("loopscan_form_error", { reason: "network" });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="border border-line bg-paper px-6 py-10 md:px-8 md:py-12">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-copper">
          Received
        </p>
        <h2 className="mt-4 text-3xl font-medium tracking-tight text-ink">
          We’ve got it.
        </h2>
        <p className="mt-4 max-w-md text-[15px] leading-7 text-graphite">
          Thanks for sharing the process. We’ll review what you described and
          follow up with a few initial thoughts.
        </p>
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
              onClick={() => track("schedule_click")}
              className="mt-6 inline-flex items-center justify-center rounded-[2px] bg-copper px-6 py-3.5 text-[14px] font-medium tracking-[0.02em] text-white transition-colors hover:bg-copper-dark"
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
      onSubmit={onSubmit}
      noValidate
      className="relative grid gap-5"
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
        <p
          role="alert"
          className="border border-copper/30 bg-copper-soft px-4 py-3 text-sm text-ink"
        >
          {formError}
        </p>
      ) : null}

      <label className="grid gap-2">
        <span className="text-[12px] font-medium text-graphite">Name</span>
        <input
          name="name"
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
          className={`${fieldClass} ${errors.name ? "border-copper" : "border-line"}`}
        />
        {errors.name ? (
          <span id="name-error" className="text-[12px] text-copper">
            {errors.name}
          </span>
        ) : null}
      </label>

      <label className="grid gap-2">
        <span className="text-[12px] font-medium text-graphite">Company</span>
        <input
          name="company"
          value={form.company}
          onChange={(event) => update("company", event.target.value)}
          autoComplete="organization"
          aria-invalid={Boolean(errors.company)}
          aria-describedby={errors.company ? "company-error" : undefined}
          className={`${fieldClass} ${errors.company ? "border-copper" : "border-line"}`}
        />
        {errors.company ? (
          <span id="company-error" className="text-[12px] text-copper">
            {errors.company}
          </span>
        ) : null}
      </label>

      <label className="grid gap-2">
        <span className="text-[12px] font-medium text-graphite">
          Work Email
        </span>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={(event) => update("email", event.target.value)}
          autoComplete="email"
          inputMode="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={`${fieldClass} ${errors.email ? "border-copper" : "border-line"}`}
        />
        {errors.email ? (
          <span id="email-error" className="text-[12px] text-copper">
            {errors.email}
          </span>
        ) : null}
      </label>

      <fieldset>
        <legend className="text-[12px] font-medium text-graphite">
          What area is this in?
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {loopScanAreas.map((area) => {
            const selected = form.area === area;
            return (
              <label
                key={area}
                className={`cursor-pointer border px-3 py-2 text-[13px] transition-colors ${
                  selected
                    ? "border-copper bg-copper-soft text-ink"
                    : "border-line bg-cream text-graphite hover:border-ink"
                }`}
              >
                <input
                  type="radio"
                  name="area"
                  value={area}
                  checked={selected}
                  onChange={() => {
                    update("area", area);
                    track("loopscan_area_selected", { area });
                  }}
                  className="sr-only"
                />
                {area}
              </label>
            );
          })}
        </div>
        {errors.area ? (
          <p className="mt-2 text-[12px] text-copper">{errors.area}</p>
        ) : null}
      </fieldset>

      <label className="grid gap-2">
        <span className="text-[12px] font-medium text-graphite">
          What process would you like to improve?
        </span>
        <textarea
          name="process"
          rows={6}
          value={form.process}
          onChange={(event) => update("process", event.target.value)}
          placeholder="Tell us what happens today. What takes too long, requires repetitive work, depends on scattered information, or regularly creates frustration?"
          aria-invalid={Boolean(errors.process)}
          aria-describedby={errors.process ? "process-error" : undefined}
          className={`${fieldClass} min-h-[140px] resize-y ${errors.process ? "border-copper" : "border-line"}`}
        />
        {errors.process ? (
          <span id="process-error" className="text-[12px] text-copper">
            {errors.process}
          </span>
        ) : null}
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 inline-flex items-center justify-center rounded-[2px] bg-copper px-6 py-3.5 text-[14px] font-medium tracking-[0.02em] text-white transition-colors hover:bg-copper-dark disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "Sending…" : "Find My First Loop"}
      </button>
      <p className="text-[13px] leading-6 text-stone">
        Start with the problem. We’ll figure out the technology later.
      </p>
    </form>
  );
}
