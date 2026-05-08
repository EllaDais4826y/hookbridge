/**
 * Simple in-memory response cache for deduplicating fanout responses
 * within a configurable TTL window.
 */

export interface CachedResponse {
  statusCode: number;
  body: string;
  cachedAt: number;
}

export interface ResponseCacheOptions {
  ttlMs: number;
  maxEntries: number;
}

const DEFAULT_OPTIONS: ResponseCacheOptions = {
  ttlMs: 60_000,
  maxEntries: 500,
};

let cache = new Map<string, CachedResponse>();
let options: ResponseCacheOptions = { ...DEFAULT_OPTIONS };

export function configureResponseCache(opts: Partial<ResponseCacheOptions>): void {
  options = { ...DEFAULT_OPTIONS, ...opts };
}

export function getCached(key: string): CachedResponse | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.cachedAt > options.ttlMs) {
    cache.delete(key);
    return undefined;
  }
  return entry;
}

export function setCached(key: string, statusCode: number, body: string): void {
  if (cache.size >= options.maxEntries) {
    // Evict oldest entry
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { statusCode, body, cachedAt: Date.now() });
}

export function invalidate(key: string): boolean {
  return cache.delete(key);
}

export function clearResponseCache(): void {
  cache.clear();
}

export function responseCacheSize(): number {
  return cache.size;
}

export function pruneExpired(): number {
  const now = Date.now();
  let pruned = 0;
  for (const [key, entry] of cache.entries()) {
    if (now - entry.cachedAt > options.ttlMs) {
      cache.delete(key);
      pruned++;
    }
  }
  return pruned;
}
