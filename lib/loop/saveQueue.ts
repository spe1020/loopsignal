/** Serialize snapshots: a slow older save must never overwrite a newer edit. */
export function createSaveQueue<T, R>(save: (doc: T) => Promise<R>) {
  let pending: Promise<unknown> = Promise.resolve();
  return (doc: T): Promise<R> => {
    const next = pending.catch(() => undefined).then(() => save(doc));
    pending = next;
    return next;
  };
}
