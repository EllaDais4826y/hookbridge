export interface Metrics {
  totalRequests: number;
  successfulFanouts: number;
  failedFanouts: number;
  totalRetries: number;
  endpointStats: Record<string, EndpointStat>;
}

export interface EndpointStat {
  attempts: number;
  successes: number;
  failures: number;
  lastStatusCode?: number;
  lastAttemptAt?: string;
}

let state: Metrics = createEmptyMetrics();

export function createEmptyMetrics(): Metrics {
  return {
    totalRequests: 0,
    successfulFanouts: 0,
    failedFanouts: 0,
    totalRetries: 0,
    endpointStats: {},
  };
}

export function resetMetrics(): void {
  state = createEmptyMetrics();
}

export function getMetrics(): Metrics {
  return structuredClone(state);
}

export function recordRequest(): void {
  state.totalRequests += 1;
}

export function recordFanoutResult(success: boolean): void {
  if (success) {
    state.successfulFanouts += 1;
  } else {
    state.failedFanouts += 1;
  }
}

export function recordRetry(): void {
  state.totalRetries += 1;
}

export function recordEndpointAttempt(
  url: string,
  statusCode: number | undefined,
  success: boolean
): void {
  if (!state.endpointStats[url]) {
    state.endpointStats[url] = { attempts: 0, successes: 0, failures: 0 };
  }
  const stat = state.endpointStats[url];
  stat.attempts += 1;
  if (success) {
    stat.successes += 1;
  } else {
    stat.failures += 1;
  }
  if (statusCode !== undefined) {
    stat.lastStatusCode = statusCode;
  }
  stat.lastAttemptAt = new Date().toISOString();
}
