import type { Investigation } from "./schema";

export function supportCount(inv: Investigation, causeId: string) {
  let supports = 0;
  let contradicts = 0;
  for (const l of inv.evidenceLinks) {
    if (
      l.causeId !== causeId ||
      !inv.evidence.some(
        (e) => e.id === l.evidenceId && e.description.trim() && e.source.trim(),
      )
    )
      continue;
    if (l.relation === "supports") supports += 1;
    else contradicts += 1;
  }
  return { supports, contradicts };
}
