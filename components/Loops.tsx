import { operationalLoop } from "@/lib/content";

export function OperationalLoop() {
  return (
    <div className="relative">
      <div className="grid grid-cols-1 gap-0 border border-line sm:grid-cols-5">
        {operationalLoop.map((step, index) => (
          <div
            key={step}
            className="relative flex min-h-[108px] flex-col justify-between border-line px-5 py-5 sm:border-r sm:last:border-r-0 [&:not(:last-child)]:border-b sm:[&:not(:last-child)]:border-b-0"
          >
            <span className="font-mono text-[11px] tracking-[0.14em] text-copper">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="mt-6 text-[15px] font-medium tracking-tight text-ink">
              {step}
            </p>
            {index < operationalLoop.length - 1 && (
              <span
                aria-hidden
                className="absolute top-1/2 right-3 hidden -translate-y-1/2 text-stone/50 sm:block"
              >
                →
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 border border-t-0 border-line px-5 py-3">
        <span className="h-px flex-1 bg-line" />
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone">
          A continuous operational loop
        </p>
        <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}

export function ProcessLoop() {
  const steps = [
    { n: "01", name: "See" },
    { n: "02", name: "Simplify" },
    { n: "03", name: "Build" },
    { n: "04", name: "Learn" },
  ];

  return (
    <div className="relative overflow-hidden border border-white/10 bg-ink">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
        viewBox="0 0 800 280"
        fill="none"
        aria-hidden
        preserveAspectRatio="none"
      >
        <rect
          className="loop-dash"
          x="70"
          y="40"
          width="660"
          height="200"
          rx="100"
          stroke="#c24e1d"
          strokeWidth="1.25"
          opacity="0.7"
        />
      </svg>
      <div className="relative grid grid-cols-2 gap-px bg-white/10 md:grid-cols-4">
        {steps.map((step) => (
          <div
            key={step.name}
            className="flex flex-col justify-between bg-ink px-6 py-8 md:min-h-[220px]"
          >
            <span className="font-mono text-[11px] tracking-[0.16em] text-copper">
              {step.n}
            </span>
            <p className="mt-10 text-2xl font-medium tracking-tight text-cream md:text-[28px]">
              {step.name}
            </p>
          </div>
        ))}
      </div>
      <p className="relative border-t border-white/10 px-6 py-4 text-center text-[12px] tracking-[0.16em] text-white/50 uppercase">
        See → Simplify → Build → Learn → Repeat
      </p>
    </div>
  );
}
