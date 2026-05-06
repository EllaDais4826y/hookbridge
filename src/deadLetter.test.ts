import {
  addDeadLetter,
  listDeadLetters,
  getDeadLetter,
  removeDeadLetter,
  clearDeadLetters,
  deadLetterCount,
} from "./deadLetter";

beforeEach(() => {
  clearDeadLetters();
});

const sample = {
  targetUrl: "https://example.com/hook",
  method: "POST",
  headers: { "content-type": "application/json" },
  body: '{"event":"test"}',
  lastError: "connect ECONNREFUSED",
  attempts: 3,
};

test("addDeadLetter assigns id and timestamp", () => {
  const entry = addDeadLetter(sample);
  expect(entry.id).toBeTruthy();
  expect(entry.timestamp).toMatch(/^\d{4}-/);
  expect(entry.targetUrl).toBe(sample.targetUrl);
});

test("listDeadLetters returns all entries", () => {
  addDeadLetter(sample);
  addDeadLetter({ ...sample, targetUrl: "https://other.com" });
  expect(listDeadLetters()).toHaveLength(2);
});

test("getDeadLetter returns correct entry by id", () => {
  const entry = addDeadLetter(sample);
  const found = getDeadLetter(entry.id);
  expect(found).toBeDefined();
  expect(found?.id).toBe(entry.id);
});

test("getDeadLetter returns undefined for unknown id", () => {
  expect(getDeadLetter("nope")).toBeUndefined();
});

test("removeDeadLetter removes entry and returns true", () => {
  const entry = addDeadLetter(sample);
  const result = removeDeadLetter(entry.id);
  expect(result).toBe(true);
  expect(deadLetterCount()).toBe(0);
});

test("removeDeadLetter returns false for unknown id", () => {
  addDeadLetter(sample);
  expect(removeDeadLetter("ghost")).toBe(false);
  expect(deadLetterCount()).toBe(1);
});

test("clearDeadLetters empties the store", () => {
  addDeadLetter(sample);
  addDeadLetter(sample);
  clearDeadLetters();
  expect(deadLetterCount()).toBe(0);
});

test("listDeadLetters returns a copy (mutation-safe)", () => {
  addDeadLetter(sample);
  const list = listDeadLetters();
  list.pop();
  expect(deadLetterCount()).toBe(1);
});
