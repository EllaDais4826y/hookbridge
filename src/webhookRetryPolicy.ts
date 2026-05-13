export type RetryStrategy = "exponential" | "linear" | "fixed";

export interface RetryPolicy {
  id: string;
  maxAttempts: number;
  strategy: RetryStrategy;
  baseDelayMs: number;
  maxDelayMs: number;
  retryOn: number[];
}

const policies = new Map<string, RetryPolicy>();

const DEFAULT_POLICY: RetryPolicy = {
  id: "default",
  maxAttempts: 3,
  strategy: "exponential",
  baseDelayMs: 500,
  maxDelayMs: 30000,
  retryOn: [429, 500, 502, 503, 504],
};

export function addRetryPolicy(policy: RetryPolicy): void {
  policies.set(policy.id, policy);
}

export function removeRetryPolicy(id: string): boolean {
  return policies.delete(id);
}

export function getRetryPolicy(id: string): RetryPolicy | undefined {
  return policies.get(id);
}

export function listRetryPolicies(): RetryPolicy[] {
  return Array.from(policies.values());
}

export function clearRetryPolicies(): void {
  policies.clear();
}

export function getDefaultPolicy(): RetryPolicy {
  return policies.get("default") ?? DEFAULT_POLICY;
}

export function computePolicyDelay(
  policy: RetryPolicy,
  attempt: number
): number {
  let delay: number;
  switch (policy.strategy) {
    case "linear":
      delay = policy.baseDelayMs * attempt;
      break;
    case "fixed":
      delay = policy.baseDelayMs;
      break;
    case "exponential":
    default:
      delay = policy.baseDelayMs * Math.pow(2, attempt - 1);
      break;
  }
  return Math.min(delay, policy.maxDelayMs);
}

export function shouldRetry(policy: RetryPolicy, statusCode: number): boolean {
  return policy.retryOn.includes(statusCode);
}
