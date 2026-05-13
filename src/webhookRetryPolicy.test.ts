import {
  addRetryPolicy,
  removeRetryPolicy,
  getRetryPolicy,
  listRetryPolicies,
  clearRetryPolicies,
  getDefaultPolicy,
  computePolicyDelay,
  shouldRetry,
  RetryPolicy,
} from "./webhookRetryPolicy";

const samplePolicy: RetryPolicy = {
  id: "test-policy",
  maxAttempts: 5,
  strategy: "exponential",
  baseDelayMs: 200,
  maxDelayMs: 10000,
  retryOn: [500, 503],
};

beforeEach(() => {
  clearRetryPolicies();
});

test("add and retrieve a retry policy", () => {
  addRetryPolicy(samplePolicy);
  const found = getRetryPolicy("test-policy");
  expect(found).toEqual(samplePolicy);
});

test("remove a retry policy", () => {
  addRetryPolicy(samplePolicy);
  const removed = removeRetryPolicy("test-policy");
  expect(removed).toBe(true);
  expect(getRetryPolicy("test-policy")).toBeUndefined();
});

test("list all retry policies", () => {
  addRetryPolicy(samplePolicy);
  addRetryPolicy({ ...samplePolicy, id: "other" });
  expect(listRetryPolicies()).toHaveLength(2);
});

test("getDefaultPolicy returns built-in default when none set", () => {
  const def = getDefaultPolicy();
  expect(def.id).toBe("default");
  expect(def.strategy).toBe("exponential");
});

test("computePolicyDelay exponential", () => {
  expect(computePolicyDelay(samplePolicy, 1)).toBe(200);
  expect(computePolicyDelay(samplePolicy, 2)).toBe(400);
  expect(computePolicyDelay(samplePolicy, 3)).toBe(800);
});

test("computePolicyDelay linear", () => {
  const p: RetryPolicy = { ...samplePolicy, strategy: "linear" };
  expect(computePolicyDelay(p, 1)).toBe(200);
  expect(computePolicyDelay(p, 3)).toBe(600);
});

test("computePolicyDelay fixed", () => {
  const p: RetryPolicy = { ...samplePolicy, strategy: "fixed" };
  expect(computePolicyDelay(p, 1)).toBe(200);
  expect(computePolicyDelay(p, 5)).toBe(200);
});

test("computePolicyDelay respects maxDelayMs", () => {
  const p: RetryPolicy = { ...samplePolicy, maxDelayMs: 300 };
  expect(computePolicyDelay(p, 5)).toBe(300);
});

test("shouldRetry returns true for matching status", () => {
  expect(shouldRetry(samplePolicy, 500)).toBe(true);
  expect(shouldRetry(samplePolicy, 503)).toBe(true);
});

test("shouldRetry returns false for non-matching status", () => {
  expect(shouldRetry(samplePolicy, 200)).toBe(false);
  expect(shouldRetry(samplePolicy, 404)).toBe(false);
});
