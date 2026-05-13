import {
  pauseTarget,
  resumeTarget,
  isPaused,
  getPauseEntry,
  listPaused,
  clearPaused,
  pausedCount,
} from "./webhookPause";

beforeEach(() => clearPaused());

describe("pauseTarget", () => {
  it("marks a target as paused", () => {
    const entry = pauseTarget("https://example.com", "maintenance");
    expect(entry.target).toBe("https://example.com");
    expect(entry.reason).toBe("maintenance");
    expect(typeof entry.pausedAt).toBe("number");
  });

  it("overwrites existing pause entry", () => {
    pauseTarget("https://example.com", "first");
    const entry = pauseTarget("https://example.com", "second");
    expect(entry.reason).toBe("second");
    expect(pausedCount()).toBe(1);
  });
});

describe("resumeTarget", () => {
  it("removes a paused target", () => {
    pauseTarget("https://example.com");
    expect(resumeTarget("https://example.com")).toBe(true);
    expect(isPaused("https://example.com")).toBe(false);
  });

  it("returns false if target was not paused", () => {
    expect(resumeTarget("https://not-paused.com")).toBe(false);
  });
});

describe("isPaused", () => {
  it("returns false when target is not paused", () => {
    expect(isPaused("https://example.com")).toBe(false);
  });

  it("returns true when target is explicitly paused", () => {
    pauseTarget("https://example.com");
    expect(isPaused("https://example.com")).toBe(true);
  });

  it("returns true for any target when global pause (*) is set", () => {
    pauseTarget("*");
    expect(isPaused("https://anything.com")).toBe(true);
  });
});

describe("listPaused / getPauseEntry", () => {
  it("lists all paused entries", () => {
    pauseTarget("https://a.com");
    pauseTarget("https://b.com");
    expect(listPaused()).toHaveLength(2);
  });

  it("gets a specific entry", () => {
    pauseTarget("https://a.com", "test");
    const entry = getPauseEntry("https://a.com");
    expect(entry?.reason).toBe("test");
  });

  it("returns undefined for unknown target", () => {
    expect(getPauseEntry("https://unknown.com")).toBeUndefined();
  });
});

describe("clearPaused", () => {
  it("removes all paused targets", () => {
    pauseTarget("https://a.com");
    pauseTarget("https://b.com");
    clearPaused();
    expect(pausedCount()).toBe(0);
  });
});
