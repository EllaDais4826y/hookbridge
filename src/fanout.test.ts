import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fanout, deliverToEndpoint } from './fanout';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function makeResponse(status: number, ok: boolean) {
  return Promise.resolve({ ok, status } as Response);
}

beforeEach(() => {
  vi.useFakeTimers();
  mockFetch.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('deliverToEndpoint', () => {
  it('returns success on first attempt with 200', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });
    const result = await deliverToEndpoint({ url: 'https://example.com/hook' }, { event: 'test' }, { maxRetries: 0 });
    expect(result.success).toBe(true);
    expect(result.attempts).toBe(1);
    expect(result.statusCode).toBe(200);
  });

  it('retries on non-ok response and eventually fails', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });
    const resultPromise = deliverToEndpoint(
      { url: 'https://example.com/hook' },
      { event: 'test' },
      { maxRetries: 2 }
    );
    await vi.runAllTimersAsync();
    const result = await resultPromise;
    expect(result.success).toBe(false);
    expect(result.attempts).toBe(3);
    expect(result.statusCode).toBe(500);
  });

  it('succeeds on second attempt after initial failure', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    const resultPromise = deliverToEndpoint(
      { url: 'https://example.com/hook' },
      { event: 'ping' },
      { maxRetries: 2 }
    );
    await vi.runAllTimersAsync();
    const result = await resultPromise;
    expect(result.success).toBe(true);
    expect(result.attempts).toBe(2);
  });

  it('captures error message on fetch exception', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const resultPromise = deliverToEndpoint(
      { url: 'https://example.com/hook' },
      {},
      { maxRetries: 1 }
    );
    await vi.runAllTimersAsync();
    const result = await resultPromise;
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });
});

describe('fanout', () => {
  it('delivers to all endpoints and returns all results', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });
    const endpoints = [
      { url: 'https://a.example.com/hook' },
      { url: 'https://b.example.com/hook' },
    ];
    const results = await fanout(endpoints, { event: 'created' }, { maxRetries: 0 });
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.success)).toBe(true);
  });
});
