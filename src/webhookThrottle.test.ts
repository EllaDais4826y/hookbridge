import {
  addEndpointThrottle,
  removeEndpointThrottle,
  getEndpointThrottle,
  listEndpointThrottles,
  clearEndpointThrottles,
  checkEndpointThrottle,
  getThrottleState,
} from "./webhookThrottle";

beforeEach(() => {
  clearEndpointThrottles();
});

test("allows requests when no rule exists", () => {
  expect(checkEndpointThrottle("https://example.com/hook")).toBe(true);
});

test("adds and retrieves a throttle rule", () => {
  addEndpointThrottle({ endpoint: "https://a.com", maxPerWindow: 5, windowMs: 1000 });
  const rule = getEndpointThrottle("https://a.com");
  expect(rule).toBeDefined();
  expect(rule?.maxPerWindow).toBe(5);
});

test("allows up to maxPerWindow requests", () => {
  addEndpointThrottle({ endpoint: "https://b.com", maxPerWindow: 3, windowMs: 5000 });
  expect(checkEndpointThrottle("https://b.com")).toBe(true);
  expect(checkEndpointThrottle("https://b.com")).toBe(true);
  expect(checkEndpointThrottle("https://b.com")).toBe(true);
  expect(checkEndpointThrottle("https://b.com")).toBe(false);
});

test("resets count after window expires", () => {
  addEndpointThrottle({ endpoint: "https://c.com", maxPerWindow: 1, windowMs: 50 });
  expect(checkEndpointThrottle("https://c.com")).toBe(true);
  expect(checkEndpointThrottle("https://c.com")).toBe(false);

  return new Promise<void>((resolve) =>
    setTimeout(() => {
      expect(checkEndpointThrottle("https://c.com")).toBe(true);
      resolve();
    }, 60)
  );
});

test("removes a throttle rule", () => {
  addEndpointThrottle({ endpoint: "https://d.com", maxPerWindow: 2, windowMs: 1000 });
  expect(removeEndpointThrottle("https://d.com")).toBe(true);
  expect(getEndpointThrottle("https://d.com")).toBeUndefined();
  expect(removeEndpointThrottle("https://d.com")).toBe(false);
});

test("lists all throttle rules", () => {
  addEndpointThrottle({ endpoint: "https://e.com", maxPerWindow: 10, windowMs: 2000 });
  addEndpointThrottle({ endpoint: "https://f.com", maxPerWindow: 20, windowMs: 3000 });
  const list = listEndpointThrottles();
  expect(list).toHaveLength(2);
  expect(list.map((r) => r.endpoint)).toContain("https://e.com");
});

test("getThrottleState returns count and windowStart", () => {
  addEndpointThrottle({ endpoint: "https://g.com", maxPerWindow: 5, windowMs: 1000 });
  checkEndpointThrottle("https://g.com");
  checkEndpointThrottle("https://g.com");
  const state = getThrottleState("https://g.com");
  expect(state?.count).toBe(2);
  expect(typeof state?.windowStart).toBe("number");
});

test("clears all rules", () => {
  addEndpointThrottle({ endpoint: "https://h.com", maxPerWindow: 1, windowMs: 1000 });
  clearEndpointThrottles();
  expect(listEndpointThrottles()).toHaveLength(0);
});
