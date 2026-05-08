/**
 * Request throttle: limits the number of in-flight requests processed
 * concurrently, queuing excess requests up to a configurable limit.
 */

export interface ThrottleOptions {
  maxConcurrent: number;
  maxQueueSize: number;
}

interface ThrottleState {
  options: ThrottleOptions;
  active: number;
  queue: Array<() => void>;
}

const defaultOptions: ThrottleOptions = {
  maxConcurrent: 10,
  maxQueueSize: 100,
};

let state: ThrottleState = {
  options: { ...defaultOptions },
  active: 0,
  queue: [],
};

export function configureThrottle(opts: Partial<ThrottleOptions>): void {
  state.options = { ...defaultOptions, ...opts };
}

export function getThrottleOptions(): ThrottleOptions {
  return { ...state.options };
}

export function resetThrottle(): void {
  state = {
    options: { ...defaultOptions },
    active: 0,
    queue: [],
  };
}

export function activeCount(): number {
  return state.active;
}

export function queuedCount(): number {
  return state.queue.length;
}

/**
 * Acquire a throttle slot. Resolves when a slot is available.
 * Rejects if the queue is full.
 */
export function acquire(): Promise<void> {
  if (state.active < state.options.maxConcurrent) {
    state.active++;
    return Promise.resolve();
  }
  if (state.queue.length >= state.options.maxQueueSize) {
    return Promise.reject(new Error("Throttle queue full"));
  }
  return new Promise<void>((resolve) => {
    state.queue.push(resolve);
  });
}

/**
 * Release a throttle slot, allowing the next queued request to proceed.
 */
export function release(): void {
  const next = state.queue.shift();
  if (next) {
    next();
  } else {
    state.active = Math.max(0, state.active - 1);
  }
}
