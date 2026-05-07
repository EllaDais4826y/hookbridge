export type CircuitState = "closed" | "open" | "half-open";

export interface CircuitBreakerOptions {
  failureThreshold: number;
  successThreshold: number;
  timeout: number; // ms before moving open -> half-open
}

export interface CircuitBreaker {
  state: CircuitState;
  failures: number;
  successes: number;
  openedAt: number | null;
  options: CircuitBreakerOptions;
}

export function createCircuitBreaker(
  options: Partial<CircuitBreakerOptions> = {}
): CircuitBreaker {
  return {
    state: "closed",
    failures: 0,
    successes: 0,
    openedAt: null,
    options: {
      failureThreshold: options.failureThreshold ?? 5,
      successThreshold: options.successThreshold ?? 2,
      timeout: options.timeout ?? 30_000,
    },
  };
}

export function isAllowed(cb: CircuitBreaker): boolean {
  if (cb.state === "closed") return true;
  if (cb.state === "open") {
    const elapsed = Date.now() - (cb.openedAt ?? 0);
    if (elapsed >= cb.options.timeout) {
      cb.state = "half-open";
      cb.successes = 0;
      return true;
    }
    return false;
  }
  // half-open: allow one probe
  return true;
}

export function recordSuccess(cb: CircuitBreaker): void {
  if (cb.state === "half-open") {
    cb.successes += 1;
    if (cb.successes >= cb.options.successThreshold) {
      cb.state = "closed";
      cb.failures = 0;
      cb.successes = 0;
      cb.openedAt = null;
    }
  } else {
    cb.failures = 0;
  }
}

export function recordFailure(cb: CircuitBreaker): void {
  cb.failures += 1;
  if (
    cb.state === "half-open" ||
    cb.failures >= cb.options.failureThreshold
  ) {
    cb.state = "open";
    cb.openedAt = Date.now();
    cb.successes = 0;
  }
}
