import { describe, it, expect, beforeEach } from "vitest";
import {
  configureDedupe,
  isDuplicate,
  markSeen,
  clearSeen,
  seenCount,
} from "./dedupe.js";

beforeEach(() => {
  clearSeen();
  configureDedupe({ ttlMs: 60_000 });
});

describe("isDuplicate", () => {
  it("returns false for unseen id", () => {
    expect(isDuplicate("abc-123")).toBe(false);
  });

  it("returns true after markSeen", () => {
    markSeen("abc-123");
    expect(isDuplicate("abc-123")).toBe(true);
  });

  it("does not confuse different ids", () => {
    markSeen("id-1");
    expect(isDuplicate("id-2")).toBe(false);
  });
});

describe("seenCount", () => {
  it("reflects number of tracked ids", () => {
    markSeen("a");
    markSeen("b");
    expect(seenCount()).toBe(2);
  });

  it("does not double-count same id", () => {
    markSeen("a");
    markSeen("a");
    expect(seenCount()).toBe(1);
  });
});

describe("TTL eviction", () => {
  it("evicts entries older than ttl", async () => {
    configureDedupe({ ttlMs: 10 });
    markSeen("old-id");
    await new Promise((r) => setTimeout(r, 20));
    expect(isDuplicate("old-id")).toBe(false);
    expect(seenCount()).toBe(0);
  });

  it("retains entries within ttl", async () => {
    configureDedupe({ ttlMs: 500 });
    markSeen("fresh-id");
    await new Promise((r) => setTimeout(r, 10));
    expect(isDuplicate("fresh-id")).toBe(true);
  });

  it("evicts only expired entries, retains fresh ones", async () => {
    configureDedupe({ ttlMs: 50 });
    markSeen("old-id");
    await new Promise((r) => setTimeout(r, 60));
    markSeen("new-id");
    expect(isDuplicate("old-id")).toBe(false);
    expect(isDuplicate("new-id")).toBe(true);
    expect(seenCount()).toBe(1);
  });
});

describe("clearSeen", () => {
  it("removes all entries", () => {
    markSeen("x");
    markSeen("y");
    clearSeen();
    expect(seenCount()).toBe(0);
    expect(isDuplicate("x")).toBe(false);
  });
});
