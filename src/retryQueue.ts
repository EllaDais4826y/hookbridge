import { addDeadLetter } from './deadLetter';
import { computeDelay, sleep } from './retry';
import { recordEndpointFailure, recordEndpointSuccess } from './endpointHealth';

export interface RetryJob {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
}

const queue: RetryJob[] = [];
let running = false;

export function enqueueRetry(job: Omit<RetryJob, 'attempts' | 'createdAt'>): void {
  queue.push({ ...job, attempts: 0, createdAt: Date.now() });
  if (!running) processQueue();
}

export function listRetryQueue(): RetryJob[] {
  return [...queue];
}

export function clearRetryQueue(): void {
  queue.length = 0;
}

export function retryQueueSize(): number {
  return queue.length;
}

async function processQueue(): Promise<void> {
  running = true;
  while (queue.length > 0) {
    const job = queue.shift()!;
    await processJob(job);
  }
  running = false;
}

async function processJob(job: RetryJob): Promise<void> {
  for (let attempt = 1; attempt <= job.maxAttempts; attempt++) {
    if (attempt > 1) {
      const delay = computeDelay(attempt - 1);
      await sleep(delay);
    }
    try {
      const res = await fetch(job.url, {
        method: job.method,
        headers: job.headers,
        body: job.body || undefined,
      });
      if (res.ok) {
        recordEndpointSuccess(job.url);
        return;
      }
      recordEndpointFailure(job.url);
    } catch {
      recordEndpointFailure(job.url);
    }
  }
  addDeadLetter({
    id: job.id,
    url: job.url,
    method: job.method,
    headers: job.headers,
    body: job.body,
    reason: `Failed after ${job.maxAttempts} attempts`,
    timestamp: Date.now(),
  });
}
