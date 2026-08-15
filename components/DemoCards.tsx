import { Button } from "@/components/Button";

const demos = [
  {
    href: "/signal",
    name: "LoopSignal",
    summary: "Find what needs attention in an open PO report.",
    detail: "Supply chain exceptions",
    cta: "Try LoopSignal",
  },
  {
    href: "/know",
    name: "LoopKnow",
    summary: "Turn manufacturing documents into trusted, cited answers.",
    detail: "Manufacturing knowledge",
    cta: "Try LoopKnow",
  },
  {
    href: "/source",
    name: "LoopSource",
    summary: "Compare supplier quotes and understand the tradeoffs behind the award.",
    detail: "Sourcing decisions",
    cta: "Try LoopSource",
  },
] as const;

export function DemoCards() {
  return (
    <div className="grid gap-px border border-line bg-line lg:grid-cols-3">
      {demos.map((demo) => (
        <article key={demo.href} className="bg-cream p-8 md:p-10">
          <p className="text-[12px] font-medium tracking-[0.04em] text-copper uppercase">
            {demo.name}
          </p>
          <h3 className="mt-3 text-2xl font-medium tracking-tight text-ink">
            {demo.summary}
          </h3>
          <p className="mt-3 text-[15px] leading-7 text-graphite">{demo.detail}</p>
          <div className="mt-6">
            <Button href={demo.href}>{demo.cta}</Button>
          </div>
        </article>
      ))}
    </div>
  );
}
