"use client";

import { useState } from "react";

export function IntakeForm() {
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="border border-line bg-paper px-8 py-12">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-copper">
          Received
        </p>
        <h2 className="mt-4 text-3xl font-medium tracking-tight text-ink">
          Thanks. We’ll review the process and follow up to learn more.
        </h2>
      </div>
    );
  }

  const field =
    "w-full border border-line bg-cream px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-stone/70 focus:border-ink";

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <label className="grid gap-2">
        <span className="text-[12px] font-medium text-graphite">Name</span>
        <input required name="name" className={field} autoComplete="name" />
      </label>
      <label className="grid gap-2">
        <span className="text-[12px] font-medium text-graphite">Company</span>
        <input
          required
          name="company"
          className={field}
          autoComplete="organization"
        />
      </label>
      <label className="grid gap-2">
        <span className="text-[12px] font-medium text-graphite">
          Work Email
        </span>
        <input
          required
          type="email"
          name="email"
          className={field}
          autoComplete="email"
        />
      </label>
      <label className="grid gap-2">
        <span className="text-[12px] font-medium text-graphite">
          What process would you like to improve?
        </span>
        <textarea
          required
          name="process"
          rows={5}
          className={`${field} resize-y`}
          placeholder="Tell us about something that takes too long, requires repetitive work, depends on disconnected information, or regularly creates frustration."
        />
      </label>
      <button
        type="submit"
        className="mt-2 inline-flex items-center justify-center rounded-[2px] bg-copper px-6 py-3.5 text-[14px] font-medium tracking-[0.02em] text-white transition-colors hover:bg-copper-dark"
      >
        Start My LoopScan
      </button>
    </form>
  );
}
