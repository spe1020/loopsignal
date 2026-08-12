"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const intents = [
  { value: "loopscan", label: "LoopScan" },
  { value: "loopbuild", label: "LoopBuild" },
  { value: "loopops", label: "LoopOps" },
  { value: "other", label: "Not sure yet" },
];

export function ContactForm() {
  const searchParams = useSearchParams();
  const defaultIntent = useMemo(() => {
    const value = searchParams.get("intent");
    return intents.some((item) => item.value === value) ? value : "loopscan";
  }, [searchParams]);

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
          We have it.
        </h2>
        <p className="mt-4 max-w-md text-[15px] leading-7 text-graphite">
          Show us the process. We’ll help you make it better. Someone from
          LoopWorks will follow up shortly.
        </p>
      </div>
    );
  }

  const field =
    "w-full border border-line bg-cream px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-stone/70 focus:border-ink";

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
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
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-[12px] font-medium text-graphite">Role</span>
          <input
            required
            name="role"
            className={field}
            placeholder="Plant manager, buyer, VP operations…"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-[12px] font-medium text-graphite">Email</span>
          <input
            required
            type="email"
            name="email"
            className={field}
            autoComplete="email"
          />
        </label>
      </div>
      <label className="grid gap-2">
        <span className="text-[12px] font-medium text-graphite">
          Where should we start?
        </span>
        <select
          name="intent"
          defaultValue={defaultIntent ?? "loopscan"}
          className={`${field} appearance-none`}
        >
          {intents.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2">
        <span className="text-[12px] font-medium text-graphite">
          What process should we look at?
        </span>
        <textarea
          required
          name="process"
          rows={5}
          className={`${field} resize-y`}
          placeholder="The work your team hates doing is a good place to start."
        />
      </label>
      <button
        type="submit"
        className="mt-2 inline-flex items-center justify-center rounded-[2px] bg-copper px-5 py-3 text-[13px] font-medium tracking-[0.02em] text-white transition-colors hover:bg-copper-dark"
      >
        Talk to LoopWorks
      </button>
    </form>
  );
}
