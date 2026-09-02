export type Migration = (doc: Record<string, unknown>) => Record<string, unknown>;

/**
 * Run migrations keyed by the version they upgrade FROM until the document
 * reaches `target`. Unknown gaps stop the walk; the schema parse then reports.
 */
export function runMigrations(
  doc: Record<string, unknown>,
  migrations: Record<number, Migration>,
  target: number,
): Record<string, unknown> {
  let version = typeof doc.schemaVersion === "number" ? doc.schemaVersion : 1;
  let current = doc;
  while (version < target) {
    const step = migrations[version];
    if (!step) break;
    current = step(current);
    version += 1;
    current.schemaVersion = version;
  }
  return current;
}

export function readableZodError(err: { issues: { path: PropertyKey[]; message: string }[] }, noun: string): string {
  const first = err.issues[0];
  if (!first) return `The file is not a ${noun}.`;
  const path = first.path.length ? first.path.map(String).join(".") : "document";
  return `Invalid ${noun} file: ${path} — ${first.message}.`;
}
