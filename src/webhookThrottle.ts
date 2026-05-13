// Per-endpoint throttle: limits how many events are forwarded to an endpoint per time window

export interface EndpointThrottleRule {
  endpoint: string;
  maxPerWindow: number;
  windowMs: number;
}

interface ThrottleState {
  rule: EndpointThrottleRule;
  count: number;
  windowStart: number;
}

const throttleMap = new Map<string, ThrottleState>();

export function addEndpointThrottle(rule: EndpointThrottleRule): void {
  throttleMap.set(rule.endpoint, {
    rule,
    count: 0,
    windowStart: Date.now(),
  });
}

export function removeEndpointThrottle(endpoint: string): boolean {
  return throttleMap.delete(endpoint);
}

export function getEndpointThrottle(endpoint: string): EndpointThrottleRule | undefined {
  return throttleMap.get(endpoint)?.rule;
}

export function listEndpointThrottles(): EndpointThrottleRule[] {
  return Array.from(throttleMap.values()).map((s) => s.rule);
}

export function clearEndpointThrottles(): void {
  throttleMap.clear();
}

/**
 * Returns true if the event should be forwarded (not throttled).
 * Resets window automatically when windowMs has elapsed.
 */
export function checkEndpointThrottle(endpoint: string): boolean {
  const state = throttleMap.get(endpoint);
  if (!state) return true;

  const now = Date.now();
  if (now - state.windowStart >= state.rule.windowMs) {
    state.count = 0;
    state.windowStart = now;
  }

  if (state.count >= state.rule.maxPerWindow) {
    return false;
  }

  state.count++;
  return true;
}

export function getThrottleState(endpoint: string): { count: number; windowStart: number } | undefined {
  const state = throttleMap.get(endpoint);
  if (!state) return undefined;
  return { count: state.count, windowStart: state.windowStart };
}
