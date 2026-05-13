import {
  muteTarget,
  unmuteTarget,
  isMuted,
  getMuteEntry,
  listMuted,
  clearMutes,
  muteCount,
} from "./webhookMute";

beforeEach(() => {
  clearMutes();
});

describe("muteTarget", () => {
  it("creates a mute entry with timestamp", () => {
    const before = Date.now();
    const entry = muteTarget("https://example.com/hook", "maintenance");
    expect(entry.target).toBe("https://example.com/hook");
    expect(entry.reason).toBe("maintenance");
    expect(entry.mutedAt).toBeGreaterThanOrEqual(before);
  });

  it("overwrites an existing mute entry", () => {
    muteTarget("https://a.com", "first");
    const entry = muteTarget("https://a.com", "second");
    expect(entry.reason).toBe("second");
    expect(muteCount()).toBe(1);
  });
});

describe("isMuted", () => {
  it("returns true for muted targets", () => {
    muteTarget("https://b.com");
    expect(isMuted("https://b.com")).toBe(true);
  });

  it("returns false for unknown targets", () => {
    expect(isMuted("https://unknown.com")).toBe(false);
  });
});

describe("unmuteTarget", () => {
  it("removes an existing mute and returns true", () => {
    muteTarget("https://c.com");
    expect(unmuteTarget("https://c.com")).toBe(true);
    expect(isMuted("https://c.com")).toBe(false);
  });

  it("returns false when target was not muted", () => {
    expect(unmuteTarget("https://nope.com")).toBe(false);
  });
});

describe("getMuteEntry", () => {
  it("returns the entry for a muted target", () => {
    muteTarget("https://d.com", "testing");
    const entry = getMuteEntry("https://d.com");
    expect(entry).toBeDefined();
    expect(entry?.reason).toBe("testing");
  });

  it("returns undefined for an unknown target", () => {
    expect(getMuteEntry("https://ghost.com")).toBeUndefined();
  });
});

describe("listMuted", () => {
  it("returns all muted entries", () => {
    muteTarget("https://e.com");
    muteTarget("https://f.com");
    const list = listMuted();
    expect(list).toHaveLength(2);
    expect(list.map((e) => e.target)).toContain("https://e.com");
  });
});

describe("clearMutes", () => {
  it("removes all entries", () => {
    muteTarget("https://g.com");
    clearMutes();
    expect(muteCount()).toBe(0);
    expect(listMuted()).toEqual([]);
  });
});
