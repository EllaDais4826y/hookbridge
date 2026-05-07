import {
  recordRequestLog,
  listRequestLogs,
  clearRequestLogs,
  generateRequestId,
  RequestLogEntry,
} from "./requestLog";

function makeEntry(overrides: Partial<RequestLogEntry> = {}): RequestLogEntry {
  return {
    id: generateRequestId(),
    timestamp: Date.now(),
    method: "POST",
    path: "/webhook",
    statusCode: 200,
    durationMs: 42,
    clientIp: "127.0.0.1",
    fanoutTargets: 2,
    fanoutSuccesses: 2,
    ...overrides,
  };
}

beforeEach(() => {
  clearRequestLogs();
});

test("starts empty", () => {
  expect(listRequestLogs()).toHaveLength(0);
});

test("records and retrieves entries in reverse chronological order", () => {
  const a = makeEntry({ path: "/a" });
  const b = makeEntry({ path: "/b" });
  recordRequestLog(a);
  recordRequestLog(b);
  const entries = listRequestLogs();
  expect(entries[0].path).toBe("/b");
  expect(entries[1].path).toBe("/a");
});

test("respects limit parameter", () => {
  for (let i = 0; i < 10; i++) {
    recordRequestLog(makeEntry({ path: `/webhook/${i}` }));
  }
  expect(listRequestLogs(3)).toHaveLength(3);
});

test("clears all entries", () => {
  recordRequestLog(makeEntry());
  clearRequestLogs();
  expect(listRequestLogs()).toHaveLength(0);
});

test("caps at MAX_ENTRIES (200)", () => {
  for (let i = 0; i < 250; i++) {
    recordRequestLog(makeEntry());
  }
  expect(listRequestLogs(250)).toHaveLength(200);
});

test("generateRequestId returns unique ids", () => {
  const ids = new Set(Array.from({ length: 100 }, () => generateRequestId()));
  expect(ids.size).toBe(100);
});
