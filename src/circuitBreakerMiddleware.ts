import type { IncomingMessage, ServerResponse } from "http";
import {
  createCircuitBreaker,
  isAllowed,
  recordSuccess,
  recordFailure,
  CircuitBreaker,
  CircuitBreakerOptions,
} from "./circuitBreaker";
import { createLogger } from "./logger";

const logger = createLogger("circuit-breaker");

// Per-endpoint registry keyed by URL string
const registry = new Map<string, CircuitBreaker>();

export function getOrCreateBreaker(
  key: string,
  options?: Partial<CircuitBreakerOptions>
): CircuitBreaker {
  if (!registry.has(key)) {
    registry.set(key, createCircuitBreaker(options));
  }
  return registry.get(key)!;
}

export function resetBreaker(key: string): void {
  registry.delete(key);
}

export function createCircuitBreakerMiddleware(
  options?: Partial<CircuitBreakerOptions>
) {
  return function circuitBreakerMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void
  ): void {
    const key = req.url ?? "/";
    const cb = getOrCreateBreaker(key, options);

    if (!isAllowed(cb)) {
      logger.warn({ url: key, state: cb.state }, "circuit open – rejecting request");
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Service temporarily unavailable", circuit: "open" }));
      return;
    }

    const originalEnd = res.end.bind(res) as typeof res.end;

    (res as any).end = function (
      ...args: Parameters<typeof res.end>
    ): ReturnType<typeof res.end> {
      const statusCode = res.statusCode ?? 200;
      if (statusCode >= 500) {
        recordFailure(cb);
        logger.warn({ url: key, failures: cb.failures, state: cb.state }, "recorded failure");
      } else {
        recordSuccess(cb);
      }
      res.end = originalEnd;
      return originalEnd(...(args as [any]));
    };

    next();
  };
}
