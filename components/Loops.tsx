import { howItWorks, operatingLoop } from "@/lib/content";

export function MethodLoop() {
  return (
    <div className="relative overflow-hidden border border-white/10 bg-ink">
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
          stroke="#E4571E"
          strokeWidth="1.4"
        />
      </svg>
      <div className="relative grid gap-px bg-white/10 md:grid-cols-2 lg:grid-cols-3">
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
        <p className="text-[12px] tracking-[0.12em] text-white/55 uppercase">
          See → Simplify → Connect → Automate → Measure → Improve → Repeat
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

export function OperatingLoop({ inverted = false }: { inverted?: boolean }) {
  const surface = inverted ? "bg-ink" : "bg-cream";
  const border = inverted ? "border-white/10" : "border-line";
  const grid = inverted ? "bg-white/10" : "bg-line";
  const title = inverted ? "text-cream" : "text-ink";
  const body = inverted ? "text-white/55" : "text-graphite";
  const phrase = inverted ? "text-white/55" : "text-stone";

  return (
    <div>
      <ol className={`grid gap-px border ${border} ${grid} sm:grid-cols-2 lg:grid-cols-3`}>
        {operatingLoop.map((step) => (
          <li key={step.name} className={`${surface} px-5 py-6`}>
            <h3 className={`text-lg font-medium tracking-tight ${title}`}>
              {step.name}
            </h3>
            <p className={`mt-2 text-sm leading-6 ${body}`}>{step.summary}</p>
          </li>
        ))}
      </ol>
      <p
        className={`mt-5 text-center text-[12px] tracking-[0.14em] uppercase ${phrase}`}
      >
        See → Simplify → Connect → Automate → Measure → Improve → Repeat
      </p>
    </div>
  );
}
