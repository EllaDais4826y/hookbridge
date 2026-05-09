/**
 * webhookTimeout.ts
 * Configures per-request timeout for outgoing fanout HTTP calls.
 */

export interface TimeoutOptions {
  /** Timeout in milliseconds for each outgoing webhook request */
  timeoutMs: number;
  /** Whether to abort in-flight requests on timeout (requires AbortController) */
  abortOnTimeout: boolean;
}

const DEFAULT_OPTIONS: TimeoutOptions = {
  timeoutMs: 5000,
  abortOnTimeout: true,
};

let currentOptions: TimeoutOptions = { ...DEFAULT_OPTIONS };

export function configureTimeout(opts: Partial<TimeoutOptions>): void {
  currentOptions = { ...currentOptions, ...opts };
}

export function getTimeoutOptions(): TimeoutOptions {
  return { ...currentOptions };
}

export function resetTimeoutOptions(): void {
  currentOptions = { ...DEFAULT_OPTIONS };
}

/**
 * Returns a promise that rejects after the configured timeout.
 * Also returns the AbortController so callers can pass its signal to fetch.
 */
export function createTimeoutSignal(): {
  signal: AbortSignal;
  timeoutId: ReturnType<typeof setTimeout>;
  controller: AbortController;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    if (currentOptions.abortOnTimeout) {
      controller.abort();
    }
  }, currentOptions.timeoutMs);
  return { signal: controller.signal, timeoutId, controller };
}

/**
 * Wraps a fetch call with a timeout derived from the current options.
 * Cleans up the timeout on completion.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  const { signal, timeoutId } = createTimeoutSignal();
  try {
    const response = await fetch(url, { ...init, signal });
    return response;
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error(`Request to ${url} timed out after ${currentOptions.timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
