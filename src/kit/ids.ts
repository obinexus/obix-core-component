/**
 * Deterministic element ids.
 *
 * Components generated ids with `Math.random()`, so the same configuration rendered different HTML on every run — which breaks
 * caching, snapshot tests, server/client agreement and the documented claim that "rendering is deterministic" (KD-02). Ids are now a
 * counter per prefix: the same sequence of `create*` calls always yields the same ids. Pass `id` in the config to pin one, and call
 * `resetObixIds()` to restart the sequence (tests, or one document per server request).
 */
const counters = new Map<string, number>();

/** `explicit` if given, else `<prefix>-<n>` with `n` counting from 1 per prefix. */
export function createId(prefix: string, explicit?: string): string {
  if (explicit) return explicit;
  const next = (counters.get(prefix) ?? 0) + 1;
  counters.set(prefix, next);
  return `${prefix}-${next}`;
}

/** Restart every id sequence. */
export function resetObixIds(): void {
  counters.clear();
}
