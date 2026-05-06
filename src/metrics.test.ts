import {
  resetMetrics,
  getMetrics,
  recordRequest,
  recordFanoutResult,
  recordRetry,
  recordEndpointAttempt,
  createEmptyMetrics,
} from "./metrics";

beforeEach(() => {
  resetMetrics();
});

test("initial metrics are zeroed", () => {
  const m = getMetrics();
  expect(m.totalRequests).toBe(0);
  expect(m.successfulFanouts).toBe(0);
  expect(m.failedFanouts).toBe(0);
  expect(m.totalRetries).toBe(0);
  expect(m.endpointStats).toEqual({});
});

test("recordRequest increments totalRequests", () => {
  recordRequest();
  recordRequest();
  expect(getMetrics().totalRequests).toBe(2);
});

test("recordFanoutResult tracks successes and failures", () => {
  recordFanoutResult(true);
  recordFanoutResult(true);
  recordFanoutResult(false);
  const m = getMetrics();
  expect(m.successfulFanouts).toBe(2);
  expect(m.failedFanouts).toBe(1);
});

test("recordRetry increments totalRetries", () => {
  recordRetry();
  recordRetry();
  recordRetry();
  expect(getMetrics().totalRetries).toBe(3);
});

test("recordEndpointAttempt tracks per-endpoint stats", () => {
  const url = "https://example.com/hook";
  recordEndpointAttempt(url, 200, true);
  recordEndpointAttempt(url, 500, false);
  const stat = getMetrics().endpointStats[url];
  expect(stat.attempts).toBe(2);
  expect(stat.successes).toBe(1);
  expect(stat.failures).toBe(1);
  expect(stat.lastStatusCode).toBe(500);
  expect(stat.lastAttemptAt).toBeDefined();
});

test("getMetrics returns a snapshot, not a live reference", () => {
  const m1 = getMetrics();
  recordRequest();
  const m2 = getMetrics();
  expect(m1.totalRequests).toBe(0);
  expect(m2.totalRequests).toBe(1);
});

test("resetMetrics clears all state", () => {
  recordRequest();
  recordRetry();
  resetMetrics();
  expect(getMetrics()).toEqual(createEmptyMetrics());
});
