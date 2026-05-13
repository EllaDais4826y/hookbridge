import {
  addSnapshot,
  getSnapshot,
  listSnapshots,
  removeSnapshot,
  clearSnapshots,
  snapshotCount,
  generateSnapshotId,
} from "./webhookSnapshot";

beforeEach(() => clearSnapshots());

test("generateSnapshotId returns unique ids", () => {
  const a = generateSnapshotId();
  const b = generateSnapshotId();
  expect(a).not.toBe(b);
  expect(a).toMatch(/^snap_/);
});

test("addSnapshot stores an entry", () => {
  const entry = addSnapshot("https://example.com", { event: "push" }, { "x-source": "gh" }, "push event");
  expect(entry.target).toBe("https://example.com");
  expect(entry.label).toBe("push event");
  expect(entry.capturedAt).toBeTruthy();
  expect(snapshotCount()).toBe(1);
});

test("getSnapshot retrieves by id", () => {
  const entry = addSnapshot("https://a.com", { x: 1 }, {});
  const found = getSnapshot(entry.id);
  expect(found).toEqual(entry);
});

test("getSnapshot returns undefined for unknown id", () => {
  expect(getSnapshot("nope")).toBeUndefined();
});

test("listSnapshots returns all entries", () => {
  addSnapshot("https://a.com", {}, {});
  addSnapshot("https://b.com", {}, {});
  expect(listSnapshots()).toHaveLength(2);
});

test("removeSnapshot deletes entry", () => {
  const entry = addSnapshot("https://a.com", {}, {});
  expect(removeSnapshot(entry.id)).toBe(true);
  expect(getSnapshot(entry.id)).toBeUndefined();
  expect(snapshotCount()).toBe(0);
});

test("removeSnapshot returns false for missing id", () => {
  expect(removeSnapshot("ghost")).toBe(false);
});

test("clearSnapshots empties the store", () => {
  addSnapshot("https://a.com", {}, {});
  addSnapshot("https://b.com", {}, {});
  clearSnapshots();
  expect(snapshotCount()).toBe(0);
});

test("snapshot stores payload and headers faithfully", () => {
  const payload = { event: "release", version: "1.2.3" };
  const headers = { "content-type": "application/json", "x-hook-id": "42" };
  const entry = addSnapshot("https://target.io", payload, headers);
  expect(entry.payload).toEqual(payload);
  expect(entry.headers).toEqual(headers);
});
