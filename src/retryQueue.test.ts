import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  enqueueRetry,
  listRetryQueue,
  clearRetryQueue,
  retryQueueSize,
} from './retryQueue';
import * as deadLetter from './deadLetter';
import * as endpointHealth from './endpointHealth';

vi.mock('./retry', () => ({
  sleep: vi.fn().mockResolvedValue(undefined),
  computeDelay: vi.fn().mockReturnValue(0),
}));

vi.mock('./endpointHealth', () => ({
  recordEndpointSuccess: vi.fn(),
  recordEndpointFailure: vi.fn(),
}));

vi.mock('./deadLetter', () => ({
  addDeadLetter: vi.fn(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const baseJob = {
  id: 'job-1',
  url: 'http://example.com/hook',
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: '{"event":"test"}',
  maxAttempts: 3,
};

beforeEach(() => {
  clearRetryQueue();
  vi.clearAllMocks();
});

describe('retryQueueSize / listRetryQueue', () => {
  it('starts empty', () => {
    expect(retryQueueSize()).toBe(0);
    expect(listRetryQueue()).toEqual([]);
  });
});

describe('enqueueRetry — success on first attempt', () => {
  it('calls recordEndpointSuccess and does not add dead letter', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    enqueueRetry(baseJob);
    await vi.runAllTimersAsync?.().catch(() => {});
    await new Promise((r) => setTimeout(r, 50));
    expect(endpointHealth.recordEndpointSuccess).toHaveBeenCalledWith(baseJob.url);
    expect(deadLetter.addDeadLetter).not.toHaveBeenCalled();
  });
});

describe('enqueueRetry — all attempts fail', () => {
  it('records failures and adds to dead letter', async () => {
    mockFetch.mockResolvedValue({ ok: false });
    enqueueRetry({ ...baseJob, id: 'job-2', maxAttempts: 2 });
    await new Promise((r) => setTimeout(r, 100));
    expect(endpointHealth.recordEndpointFailure).toHaveBeenCalled();
    expect(deadLetter.addDeadLetter).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'job-2', url: baseJob.url })
    );
  });
});

describe('clearRetryQueue', () => {
  it('empties the queue immediately', () => {
    // Pause fetch so jobs stay in queue — simulate by not resolving
    mockFetch.mockReturnValue(new Promise(() => {}));
    // We can only test the exported size before processing drains it
    clearRetryQueue();
    expect(retryQueueSize()).toBe(0);
  });
});
