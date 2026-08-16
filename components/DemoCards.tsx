import { Button } from "@/components/Button";
import { demos } from "@/lib/content";

export function DemoFlow({
  steps,
  className = "mt-4",
}: {
  steps: readonly string[];
  className?: string;
}) {
  return (
    <p
      className={`${className} flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] leading-5 tracking-[0.04em] text-stone uppercase`}
    >
      {steps.map((step, index) => (
        <span key={step} className="inline-flex items-center gap-2">
          {index > 0 ? (
            <span aria-hidden className="text-copper">
              →
            </span>
          ) : null}
          <span className={index === 0 ? "text-ink" : undefined}>{step}</span>
        </span>
      ))}
    </p>
  );
}

export function DemoCards({
  variant = "flow",
}: {
  variant?: "flow" | "showcase";
}) {
  return (
    <div className="grid gap-px border border-line bg-line md:grid-cols-2">
      {demos.map((demo) => (
        <article key={demo.href} className="flex flex-col bg-cream p-8 md:p-10">
          <p className="text-[12px] font-medium tracking-[0.04em] text-copper uppercase">
            {demo.name}
          </p>
          {variant === "showcase" ? (
            <>
              <h3 className="mt-3 text-2xl font-medium tracking-tight text-ink">
                {demo.category}
              </h3>
              <p className="mt-3 text-[15px] leading-7 text-graphite">
                {demo.promise}
              </p>
            </>
          ) : (
            <>
              <h3 className="mt-3 text-2xl font-medium tracking-tight text-ink">
                {demo.headline}
              </h3>
              <DemoFlow steps={demo.flow} />
              <p className="mt-4 max-w-md text-[15px] leading-7 text-graphite">
                {demo.description}
              </p>
            </>
          )}
          <div className="mt-6">
            <Button href={demo.href}>{demo.cta}</Button>
          </div>
        </article>
      ))}
    </div>
  );
}
