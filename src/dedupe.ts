/**
 * Deduplication module: tracks recently seen event IDs to prevent
 * duplicate fanout when the same webhook is delivered more than once.
 */

interface DedupeEntry {
  id: string;
  seenAt: number;
}

const store = new Map<string, DedupeEntry>();
let ttlMs = 60_000; // default: 1 minute

export function configureDedupe(options: { ttlMs?: number }): void {
  if (options.ttlMs !== undefined) {
    ttlMs = options.ttlMs;
  }
}

export function isDuplicate(id: string): boolean {
  evict();
  return store.has(id);
}

export function markSeen(id: string): void {
  evict();
  store.set(id, { id, seenAt: Date.now() });
}

export function clearSeen(): void {
  store.clear();
}

export function seenCount(): number {
  evict();
  return store.size;
}

function evict(): void {
  const cutoff = Date.now() - ttlMs;
  for (const [key, entry] of store) {
    if (entry.seenAt < cutoff) {
      store.delete(key);
    }
  }
}
