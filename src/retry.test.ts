import { withRetry, computeDelay, DEFAULT_RETRY_OPTIONS, RetryOptions } from "./retry";

describe("computeDelay", () => {
  const opts: RetryOptions = { maxAttempts: 5, initialDelayMs: 500, backoffMultiplier: 2, maxDelayMs: 30_000 };

  it("returns initialDelayMs on first attempt", () => {
    expect(computeDelay(1, opts)).toBe(500);
  });

  it("doubles delay on each attempt", () => {
    expect(computeDelay(2, opts)).toBe(1000);
    expect(computeDelay(3, opts)).toBe(2000);
  });

  it("caps delay at maxDelayMs", () => {
    expect(computeDelay(10, opts)).toBe(30_000);
  });
});

describe("withRetry", () => {
  const fastOptions: RetryOptions = { maxAttempts: 3, initialDelayMs: 0, backoffMultiplier: 1, maxDelayMs: 0 };

  it("returns success on first try", async () => {
    const fn = jest.fn().mockResolvedValue("ok");
    const result = await withRetry(fn, fastOptions);
    expect(result.success).toBe(true);
    expect(result.value).toBe("ok");
    expect(result.attempts).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and succeeds eventually", async () => {
    const fn = jest.fn().mockRejectedValueOnce(new Error("fail")).mockResolvedValue("recovered");
    const result = await withRetry(fn, fastOptions);
    expect(result.success).toBe(true);
    expect(result.value).toBe("recovered");
    expect(result.attempts).toBe(2);
  });

  it("returns failure after exhausting all attempts", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("always fails"));
    const result = await withRetry(fn, fastOptions);
    expect(result.success).toBe(false);
    expect(result.error?.message).toBe("always fails");
    expect(result.attempts).toBe(fastOptions.maxAttempts);
    expect(fn).toHaveBeenCalledTimes(fastOptions.maxAttempts);
  });

  it("uses DEFAULT_RETRY_OPTIONS when none provided", async () => {
    const fn = jest.fn().mockResolvedValue(42);
    const result = await withRetry(fn);
    expect(result.success).toBe(true);
    expect(result.value).toBe(42);
  });
});
