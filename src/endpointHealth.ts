/**
 * Tracks per-endpoint health state: consecutive failures, last success/failure timestamps.
 */

export interface EndpointHealth {
  url: string;
  consecutiveFailures: number;
  totalFailures: number;
  totalSuccesses: number;
  lastFailureAt: number | null;
  lastSuccessAt: number | null;
  healthy: boolean;
}

const store = new Map<string, EndpointHealth>();

const UNHEALTHY_THRESHOLD = 3;

export function getOrCreateHealth(url: string): EndpointHealth {
  if (!store.has(url)) {
    store.set(url, {
      url,
      consecutiveFailures: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      lastFailureAt: null,
      lastSuccessAt: null,
      healthy: true,
    });
  }
  return store.get(url)!;
}

export function recordEndpointSuccess(url: string): void {
  const h = getOrCreateHealth(url);
  h.consecutiveFailures = 0;
  h.totalSuccesses += 1;
  h.lastSuccessAt = Date.now();
  h.healthy = true;
}

export function recordEndpointFailure(url: string): void {
  const h = getOrCreateHealth(url);
  h.consecutiveFailures += 1;
  h.totalFailures += 1;
  h.lastFailureAt = Date.now();
  if (h.consecutiveFailures >= UNHEALTHY_THRESHOLD) {
    h.healthy = false;
  }
}

export function listEndpointHealth(): EndpointHealth[] {
  return Array.from(store.values());
}

export function getEndpointHealth(url: string): EndpointHealth | undefined {
  return store.get(url);
}

export function clearEndpointHealth(): void {
  store.clear();
}

export function resetEndpointHealth(url: string): void {
  store.delete(url);
}
