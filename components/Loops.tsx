import { howItWorks } from "@/lib/content";

export function MethodLoop() {
  return (
    <div className="relative overflow-hidden border border-white/10">
      <svg
        className="pointer-events-none absolute inset-0 hidden h-full w-full opacity-50 md:block"
        viewBox="0 0 1000 420"
        fill="none"
        aria-hidden
        preserveAspectRatio="none"
      >
        <rect
          className="loop-dash"
          x="48"
          y="36"
          width="904"
          height="348"
          rx="174"
          stroke="#c24e1d"
          strokeWidth="1.4"
        />
      </svg>
      <div className="relative grid gap-px bg-white/10 md:grid-cols-2">
        {howItWorks.map((step) => (
          <div
            key={step.name}
            className="flex min-h-[180px] flex-col justify-between bg-ink px-7 py-8 md:min-h-[210px] md:px-10"
          >
            <span className="font-mono text-[11px] tracking-[0.16em] text-copper">
              {step.step}
            </span>
            <div className="mt-8">
              <h3 className="text-2xl font-medium tracking-tight text-cream md:text-[32px]">
                {step.name}
              </h3>
              <p className="mt-3 max-w-sm text-[15px] leading-6 text-white/55">
                {step.summary}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="relative border-t border-white/10 px-6 py-5 text-center">
        <p className="text-[12px] tracking-[0.18em] text-white/55 uppercase">
          See → Simplify → Build → Learn
        </p>
        <p className="mt-2 text-sm text-copper">
          Kaizen is built into the process.
        </p>
      </div>
    </div>
  );
}

export function ProcessLoop() {
  return <MethodLoop />;
}
