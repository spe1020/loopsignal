import {
  existingSystems,
  loopWorksOutcomes,
} from "@/lib/content";

export function SystemsFlow() {
  return (
    <div className="border border-line">
      <div className="border-b border-line px-5 py-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone">
          Existing systems
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
        {existingSystems.map((system) => (
          <li key={system} className="bg-cream px-4 py-4 text-sm text-ink">
            {system}
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-4 border-y border-line bg-paper px-5 py-4">
        <span className="h-px flex-1 bg-line" />
        <p className="text-[12px] font-medium tracking-[0.16em] text-copper uppercase">
          → LoopWorks →
        </p>
        <span className="h-px flex-1 bg-line" />
      </div>
      <ul className="grid gap-px bg-line sm:grid-cols-3">
        {loopWorksOutcomes.map((outcome) => (
          <li
            key={outcome}
            className="bg-cream px-4 py-5 text-sm font-medium text-ink"
          >
            {outcome}
          </li>
        ))}
      </ul>
    </div>
  );
}
