import { nanoid } from "nanoid";

export function newId(): string {
  return nanoid(12);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export type Stamp = { id: string; createdAt: string; updatedAt: string };

export function stamp(at = nowIso()): Stamp {
  return { id: newId(), createdAt: at, updatedAt: at };
}

/** Replace an item in a list by id, bumping updatedAt. */
export function patchIn<T extends { id: string; updatedAt: string }>(
  list: T[],
  id: string,
  patch: Partial<T>,
  at: string,
): T[] {
  return list.map((item) => (item.id === id ? { ...item, ...patch, updatedAt: at } : item));
}
