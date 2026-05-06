import { describe, it, expect, beforeEach } from "vitest";
import { createRateLimiter } from "./rateLimiter";

describe("createRateLimiter", () => {
  let limiter: ReturnType<typeof createRateLimiter>;

  beforeEach(() => {
    limiter = createRateLimiter({ windowMs: 1000, maxRequests: 3 });
    limiter.clearAll();
  });

  it("allows requests within the limit", () => {
    expect(limiter.isAllowed("client-1")).toBe(true);
    expect(limiter.isAllowed("client-1")).toBe(true);
    expect(limiter.isAllowed("client-1")).toBe(true);
  });

  it("blocks requests exceeding the limit", () => {
    limiter.isAllowed("client-2");
    limiter.isAllowed("client-2");
    limiter.isAllowed("client-2");
    expect(limiter.isAllowed("client-2")).toBe(false);
  });

  it("tracks different keys independently", () => {
    limiter.isAllowed("a");
    limiter.isAllowed("a");
    limiter.isAllowed("a");
    expect(limiter.isAllowed("a")).toBe(false);
    expect(limiter.isAllowed("b")).toBe(true);
  });

  it("returns correct remaining count", () => {
    expect(limiter.getRemainingRequests("c")).toBe(3);
    limiter.isAllowed("c");
    expect(limiter.getRemainingRequests("c")).toBe(2);
    limiter.isAllowed("c");
    expect(limiter.getRemainingRequests("c")).toBe(1);
  });

  it("returns 0 remaining when limit exceeded", () => {
    limiter.isAllowed("d");
    limiter.isAllowed("d");
    limiter.isAllowed("d");
    limiter.isAllowed("d"); // blocked
    expect(limiter.getRemainingRequests("d")).toBe(0);
  });

  it("resets a specific key", () => {
    limiter.isAllowed("e");
    limiter.isAllowed("e");
    limiter.isAllowed("e");
    limiter.resetKey("e");
    expect(limiter.isAllowed("e")).toBe(true);
    expect(limiter.getRemainingRequests("e")).toBe(2);
  });

  it("resets window after windowMs elapses", async () => {
    const fastLimiter = createRateLimiter({ windowMs: 50, maxRequests: 1 });
    expect(fastLimiter.isAllowed("f")).toBe(true);
    expect(fastLimiter.isAllowed("f")).toBe(false);
    await new Promise((r) => setTimeout(r, 60));
    expect(fastLimiter.isAllowed("f")).toBe(true);
  });
});
