import {
  configureResponseCache,
  getCached,
  setCached,
  invalidate,
  clearResponseCache,
  responseCacheSize,
  pruneExpired,
} from "./responseCache";

beforeEach(() => {
  clearResponseCache();
  configureResponseCache({ ttlMs: 60_000, maxEntries: 500 });
});

describe("setCached / getCached", () => {
  it("stores and retrieves a response", () => {
    setCached("key1", 200, '{"ok":true}');
    const entry = getCached("key1");
    expect(entry).toBeDefined();
    expect(entry?.statusCode).toBe(200);
    expect(entry?.body).toBe('{"ok":true}');
  });

  it("returns undefined for unknown key", () => {
    expect(getCached("missing")).toBeUndefined();
  });

  it("returns undefined after TTL expires", () => {
    configureResponseCache({ ttlMs: 1 });
    setCached("key2", 201, "created");
    return new Promise<void>((resolve) =>
      setTimeout(() => {
        expect(getCached("key2")).toBeUndefined();
        resolve();
      }, 10)
    );
  });
});

describe("invalidate", () => {
  it("removes a cached entry and returns true", () => {
    setCached("key3", 200, "ok");
    expect(invalidate("key3")).toBe(true);
    expect(getCached("key3")).toBeUndefined();
  });

  it("returns false for non-existent key", () => {
    expect(invalidate("nope")).toBe(false);
  });
});

describe("responseCacheSize", () => {
  it("tracks number of entries", () => {
    setCached("a", 200, "a");
    setCached("b", 200, "b");
    expect(responseCacheSize()).toBe(2);
  });
});

describe("maxEntries eviction", () => {
  it("evicts oldest entry when limit is reached", () => {
    configureResponseCache({ maxEntries: 2, ttlMs: 60_000 });
    setCached("x", 200, "x");
    setCached("y", 200, "y");
    setCached("z", 200, "z");
    expect(responseCacheSize()).toBe(2);
    expect(getCached("x")).toBeUndefined();
    expect(getCached("y")).toBeDefined();
    expect(getCached("z")).toBeDefined();
  });
});

describe("pruneExpired", () => {
  it("removes all expired entries and returns count", () => {
    configureResponseCache({ ttlMs: 1 });
    setCached("p1", 200, "p1");
    setCached("p2", 200, "p2");
    return new Promise<void>((resolve) =>
      setTimeout(() => {
        const pruned = pruneExpired();
        expect(pruned).toBe(2);
        expect(responseCacheSize()).toBe(0);
        resolve();
      }, 10)
    );
  });

  it("returns 0 when nothing is expired", () => {
    setCached("fresh", 200, "fresh");
    expect(pruneExpired()).toBe(0);
  });
});
