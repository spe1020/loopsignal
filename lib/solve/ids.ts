import { nanoid } from "nanoid";

export function newId(): string {
  return nanoid(12);
}

export function nowIso(): string {
  return new Date().toISOString();
}
