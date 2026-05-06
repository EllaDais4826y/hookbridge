import { IncomingMessage, ServerResponse } from "http";
import { createRateLimiter, RateLimiterOptions } from "./rateLimiter";

const DEFAULT_OPTIONS: RateLimiterOptions = {
  windowMs: 60_000,  // 1 minute
  maxRequests: 100,
};

function getClientKey(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress ?? "unknown";
}

export function createRateLimiterMiddleware(options: Partial<RateLimiterOptions> = {}) {
  const opts: RateLimiterOptions = { ...DEFAULT_OPTIONS, ...options };
  const limiter = createRateLimiter(opts);

  return function rateLimiterMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void
  ): void {
    const key = getClientKey(req);
    const allowed = limiter.isAllowed(key);
    const remaining = limiter.getRemainingRequests(key);

    res.setHeader("X-RateLimit-Limit", opts.maxRequests);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Window-Ms", opts.windowMs);

    if (!allowed) {
      res.writeHead(429, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Too Many Requests" }));
      return;
    }

    next();
  };
}
