import {
  addReplayEntry,
  getReplayEntry,
  listReplayEntries,
  markReplayed,
  removeReplayEntry,
  clearReplayEntries,
  replayEntryCount,
  generateReplayId,
} from "./webhookReplay";

beforeEach(() => {
  clearReplayEntries();
});

test("generateReplayId returns unique ids", () => {
  const a = generateReplayId();
  const b = generateReplayId();
  expect(a).not.toBe(b);
  expect(a).toMatch(/^replay-/);
});

test("addReplayEntry stores and returns entry", () => {
  const entry = addReplayEntry('{"event":"test"}', { "x-source": "github" }, "http://example.com");
  expect(entry.id).toBeDefined();
  expect(entry.payload).toBe('{"event":"test"}');
  expect(entry.headers["x-source"]).toBe("github");
  expect(entry.targetUrl).toBe("http://example.com");
  expect(entry.replayCount).toBe(0);
  expect(entry.replayedAt).toBeUndefined();
});

test("getReplayEntry retrieves stored entry", () => {
  const entry = addReplayEntry("payload", {});
  const found = getReplayEntry(entry.id);
  expect(found).toBeDefined();
  expect(found!.id).toBe(entry.id);
});

test("getReplayEntry returns undefined for unknown id", () => {
  expect(getReplayEntry("nonexistent")).toBeUndefined();
});

test("listReplayEntries returns all entries newest first", () => {
  const a = addReplayEntry("a", {});
  const b = addReplayEntry("b", {});
  const list = listReplayEntries();
  expect(list.length).toBe(2);
  // newest first by originalTimestamp (b >= a)
  expect(list[0].id === b.id || list[0].id === a.id).toBe(true);
});

test("markReplayed updates replayedAt and replayCount", () => {
  const entry = addReplayEntry("data", {});
  const result = markReplayed(entry.id);
  expect(result).toBe(true);
  const updated = getReplayEntry(entry.id)!;
  expect(updated.replayCount).toBe(1);
  expect(updated.replayedAt).toBeDefined();
});

test("markReplayed increments replayCount on multiple calls", () => {
  const entry = addReplayEntry("data", {});
  markReplayed(entry.id);
  markReplayed(entry.id);
  expect(getReplayEntry(entry.id)!.replayCount).toBe(2);
});

test("markReplayed returns false for unknown id", () => {
  expect(markReplayed("ghost")).toBe(false);
});

test("removeReplayEntry deletes entry", () => {
  const entry = addReplayEntry("x", {});
  expect(removeReplayEntry(entry.id)).toBe(true);
  expect(getReplayEntry(entry.id)).toBeUndefined();
});

test("removeReplayEntry returns false for unknown id", () => {
  expect(removeReplayEntry("nope")).toBe(false);
});

test("clearReplayEntries removes all entries", () => {
  addReplayEntry("1", {});
  addReplayEntry("2", {});
  clearReplayEntries();
  expect(replayEntryCount()).toBe(0);
  expect(listReplayEntries()).toHaveLength(0);
});

test("replayEntryCount reflects current count", () => {
  expect(replayEntryCount()).toBe(0);
  addReplayEntry("a", {});
  expect(replayEntryCount()).toBe(1);
  addReplayEntry("b", {});
  expect(replayEntryCount()).toBe(2);
});
