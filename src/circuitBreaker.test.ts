import {
  createCircuitBreaker,
  isAllowed,
  recordSuccess,
  recordFailure,
} from "./circuitBreaker";

describe("createCircuitBreaker", () => {
  it("starts in closed state with defaults", () => {
    const cb = createCircuitBreaker();
    expect(cb.state).toBe("closed");
    expect(cb.failures).toBe(0);
    expect(cb.options.failureThreshold).toBe(5);
  });

  it("accepts custom options", () => {
    const cb = createCircuitBreaker({ failureThreshold: 3, timeout: 5000 });
    expect(cb.options.failureThreshold).toBe(3);
    expect(cb.options.timeout).toBe(5000);
  });
});

describe("isAllowed", () => {
  it("allows requests when closed", () => {
    const cb = createCircuitBreaker();
    expect(isAllowed(cb)).toBe(true);
  });

  it("blocks requests when open and timeout not elapsed", () => {
    const cb = createCircuitBreaker({ timeout: 60_000 });
    cb.state = "open";
    cb.openedAt = Date.now();
    expect(isAllowed(cb)).toBe(false);
  });

  it("transitions open -> half-open after timeout", () => {
    const cb = createCircuitBreaker({ timeout: 100 });
    cb.state = "open";
    cb.openedAt = Date.now() - 200;
    expect(isAllowed(cb)).toBe(true);
    expect(cb.state).toBe("half-open");
  });
});

describe("recordFailure", () => {
  it("opens circuit after reaching threshold", () => {
    const cb = createCircuitBreaker({ failureThreshold: 3 });
    recordFailure(cb);
    recordFailure(cb);
    expect(cb.state).toBe("closed");
    recordFailure(cb);
    expect(cb.state).toBe("open");
    expect(cb.openedAt).not.toBeNull();
  });

  it("opens immediately from half-open on failure", () => {
    const cb = createCircuitBreaker();
    cb.state = "half-open";
    recordFailure(cb);
    expect(cb.state).toBe("open");
  });
});

describe("recordSuccess", () => {
  it("resets failures when closed", () => {
    const cb = createCircuitBreaker();
    cb.failures = 3;
    recordSuccess(cb);
    expect(cb.failures).toBe(0);
  });

  it("closes circuit after enough successes in half-open", () => {
    const cb = createCircuitBreaker({ successThreshold: 2 });
    cb.state = "half-open";
    recordSuccess(cb);
    expect(cb.state).toBe("half-open");
    recordSuccess(cb);
    expect(cb.state).toBe("closed");
    expect(cb.openedAt).toBeNull();
  });
});
