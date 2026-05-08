import {
  clearEndpointHealth,
  getEndpointHealth,
  getOrCreateHealth,
  listEndpointHealth,
  recordEndpointFailure,
  recordEndpointSuccess,
  resetEndpointHealth,
} from "./endpointHealth";

beforeEach(() => {
  clearEndpointHealth();
});

describe("getOrCreateHealth", () => {
  it("creates a new healthy entry for an unknown url", () => {
    const h = getOrCreateHealth("https://example.com");
    expect(h.url).toBe("https://example.com");
    expect(h.healthy).toBe(true);
    expect(h.consecutiveFailures).toBe(0);
  });

  it("returns the same entry on subsequent calls", () => {
    const a = getOrCreateHealth("https://a.com");
    const b = getOrCreateHealth("https://a.com");
    expect(a).toBe(b);
  });
});

describe("recordEndpointSuccess", () => {
  it("increments totalSuccesses and resets consecutiveFailures", () => {
    recordEndpointFailure("https://x.com");
    recordEndpointSuccess("https://x.com");
    const h = getEndpointHealth("https://x.com")!;
    expect(h.consecutiveFailures).toBe(0);
    expect(h.totalSuccesses).toBe(1);
    expect(h.healthy).toBe(true);
    expect(h.lastSuccessAt).not.toBeNull();
  });
});

describe("recordEndpointFailure", () => {
  it("increments consecutiveFailures and totalFailures", () => {
    recordEndpointFailure("https://y.com");
    const h = getEndpointHealth("https://y.com")!;
    expect(h.consecutiveFailures).toBe(1);
    expect(h.totalFailures).toBe(1);
    expect(h.healthy).toBe(true);
  });

  it("marks unhealthy after 3 consecutive failures", () => {
    const url = "https://z.com";
    recordEndpointFailure(url);
    recordEndpointFailure(url);
    recordEndpointFailure(url);
    expect(getEndpointHealth(url)!.healthy).toBe(false);
  });

  it("recovery via success restores healthy state", () => {
    const url = "https://recover.com";
    for (let i = 0; i < 3; i++) recordEndpointFailure(url);
    expect(getEndpointHealth(url)!.healthy).toBe(false);
    recordEndpointSuccess(url);
    expect(getEndpointHealth(url)!.healthy).toBe(true);
  });
});

describe("listEndpointHealth", () => {
  it("returns all tracked endpoints", () => {
    getOrCreateHealth("https://a.com");
    getOrCreateHealth("https://b.com");
    expect(listEndpointHealth()).toHaveLength(2);
  });
});

describe("resetEndpointHealth", () => {
  it("removes a single endpoint", () => {
    getOrCreateHealth("https://a.com");
    resetEndpointHealth("https://a.com");
    expect(getEndpointHealth("https://a.com")).toBeUndefined();
  });
});
