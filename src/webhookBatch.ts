/**
 * Webhook batching: accumulate events and flush as a single payload.
 */

export interface BatchOptions {
  maxSize: number;   // max events per batch
  maxWaitMs: number; // max time to wait before flushing
}

export interface BatchEntry {
  id: string;
  receivedAt: string;
  body: unknown;
  headers: Record<string, string>;
}

export interface Batch {
  batchId: string;
  events: BatchEntry[];
  createdAt: string;
}

const DEFAULT_OPTIONS: BatchOptions = { maxSize: 10, maxWaitMs: 2000 };

let options: BatchOptions = { ...DEFAULT_OPTIONS };
let pendingEvents: BatchEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let onFlushCallback: ((batch: Batch) => void) | null = null;

export function configureBatch(opts: Partial<BatchOptions>): void {
  options = { ...options, ...opts };
}

export function getBatchOptions(): BatchOptions {
  return { ...options };
}

export function resetBatch(): void {
  options = { ...DEFAULT_OPTIONS };
  pendingEvents = [];
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  onFlushCallback = null;
}

export function onFlush(cb: (batch: Batch) => void): void {
  onFlushCallback = cb;
}

export function addToBatch(entry: BatchEntry): void {
  pendingEvents.push(entry);
  if (pendingEvents.length >= options.maxSize) {
    flush();
    return;
  }
  if (flushTimer === null) {
    flushTimer = setTimeout(flush, options.maxWaitMs);
  }
}

export function flush(): Batch | null {
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (pendingEvents.length === 0) return null;
  const batch: Batch = {
    batchId: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    events: pendingEvents.splice(0),
    createdAt: new Date().toISOString(),
  };
  if (onFlushCallback) onFlushCallback(batch);
  return batch;
}

export function pendingCount(): number {
  return pendingEvents.length;
}
