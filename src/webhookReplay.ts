// Webhook replay scheduling: store and re-dispatch events on demand

export interface ReplayEntry {
  id: string;
  payload: string;
  headers: Record<string, string>;
  originalTimestamp: number;
  replayedAt?: number;
  replayCount: number;
  targetUrl?: string;
}

const store = new Map<string, ReplayEntry>();

let idCounter = 0;

export function generateReplayId(): string {
  return `replay-${Date.now()}-${++idCounter}`;
}

export function addReplayEntry(
  payload: string,
  headers: Record<string, string>,
  targetUrl?: string
): ReplayEntry {
  const entry: ReplayEntry = {
    id: generateReplayId(),
    payload,
    headers,
    originalTimestamp: Date.now(),
    replayCount: 0,
    targetUrl,
  };
  store.set(entry.id, entry);
  return entry;
}

export function getReplayEntry(id: string): ReplayEntry | undefined {
  return store.get(id);
}

export function listReplayEntries(): ReplayEntry[] {
  return Array.from(store.values()).sort(
    (a, b) => b.originalTimestamp - a.originalTimestamp
  );
}

export function markReplayed(id: string): boolean {
  const entry = store.get(id);
  if (!entry) return false;
  entry.replayedAt = Date.now();
  entry.replayCount += 1;
  return true;
}

export function removeReplayEntry(id: string): boolean {
  return store.delete(id);
}

export function clearReplayEntries(): void {
  store.clear();
  idCounter = 0;
}

export function replayEntryCount(): number {
  return store.size;
}
