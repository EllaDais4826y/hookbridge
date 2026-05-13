export interface CorrelationEntry {
  requestId: string;
  timestamp: number;
  meta: Record<string, unknown>;
}

const store = new Map<string, CorrelationEntry[]>();

let maxEntries = 500;

export function configureCorrelation(options: { maxEntries?: number }): void {
  if (options.maxEntries !== undefined) {
    maxEntries = options.maxEntries;
  }
}

export function generateCorrelationId(): string {
  return `corr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function recordCorrelation(
  correlationId: string,
  requestId: string,
  meta: Record<string, unknown> = {}
): void {
  const entry: CorrelationEntry = { requestId, timestamp: Date.now(), meta };
  const existing = store.get(correlationId) ?? [];
  existing.push(entry);
  if (existing.length > maxEntries) {
    existing.shift();
  }
  store.set(correlationId, existing);
}

export function getCorrelatedRequests(correlationId: string): CorrelationEntry[] {
  return store.get(correlationId) ?? [];
}

export function listCorrelations(): Array<{ correlationId: string; count: number }> {
  const result: Array<{ correlationId: string; count: number }> = [];
  for (const [correlationId, entries] of store.entries()) {
    result.push({ correlationId, count: entries.length });
  }
  return result;
}

export function removeCorrelation(correlationId: string): boolean {
  return store.delete(correlationId);
}

export function clearCorrelations(): void {
  store.clear();
}

export function correlationCount(): number {
  return store.size;
}
