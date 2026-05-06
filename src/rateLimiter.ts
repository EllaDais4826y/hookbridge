/**
 * Simple in-memory rate limiter using a sliding window counter.
 * Tracks request counts per IP/key within a configurable time window.
 */

export interface RateLimiterOptions {
  windowMs: number;  // time window in milliseconds
  maxRequests: number; // max requests allowed per window
}

interface WindowEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, WindowEntry>();

export function createRateLimiter(options: RateLimiterOptions) {
  const { windowMs, maxRequests } = options;

  return {
    isAllowed(key: string): boolean {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || now - entry.windowStart >= windowMs) {
        store.set(key, { count: 1, windowStart: now });
        return true;
      }

      if (entry.count >= maxRequests) {
        return false;
      }

      entry.count += 1;
      return true;
    },

    getRemainingRequests(key: string): number {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || now - entry.windowStart >= windowMs) {
        return maxRequests;
      }

      return Math.max(0, maxRequests - entry.count);
    },

    resetKey(key: string): void {
      store.delete(key);
    },

    clearAll(): void {
      store.clear();
    },
  };
}

export type RateLimiter = ReturnType<typeof createRateLimiter>;
