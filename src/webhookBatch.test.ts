import {
  configureBatch,
  resetBatch,
  addToBatch,
  flush,
  pendingCount,
  onFlush,
  getBatchOptions,
  BatchEntry,
  Batch,
} from "./webhookBatch";

function makeEntry(id: string): BatchEntry {
  return {
    id,
    receivedAt: new Date().toISOString(),
    body: { event: id },
    headers: { "content-type": "application/json" },
  };
}

describe("webhookBatch", () => {
  beforeEach(() => resetBatch());

  test("getBatchOptions returns defaults", () => {
    const opts = getBatchOptions();
    expect(opts.maxSize).toBe(10);
    expect(opts.maxWaitMs).toBe(2000);
  });

  test("configureBatch updates options", () => {
    configureBatch({ maxSize: 5 });
    expect(getBatchOptions().maxSize).toBe(5);
  });

  test("pendingCount starts at zero", () => {
    expect(pendingCount()).toBe(0);
  });

  test("addToBatch increments pending count", () => {
    addToBatch(makeEntry("e1"));
    expect(pendingCount()).toBe(1);
  });

  test("flush returns null when empty", () => {
    expect(flush()).toBeNull();
  });

  test("flush returns batch with events", () => {
    addToBatch(makeEntry("e1"));
    addToBatch(makeEntry("e2"));
    const batch = flush();
    expect(batch).not.toBeNull();
    expect(batch!.events).toHaveLength(2);
    expect(pendingCount()).toBe(0);
  });

  test("flush auto-triggers when maxSize reached", () => {
    configureBatch({ maxSize: 3, maxWaitMs: 60000 });
    const batches: Batch[] = [];
    onFlush((b) => batches.push(b));
    addToBatch(makeEntry("a"));
    addToBatch(makeEntry("b"));
    addToBatch(makeEntry("c"));
    expect(batches).toHaveLength(1);
    expect(batches[0].events).toHaveLength(3);
    expect(pendingCount()).toBe(0);
  });

  test("flush calls onFlush callback", () => {
    const received: Batch[] = [];
    onFlush((b) => received.push(b));
    addToBatch(makeEntry("x"));
    flush();
    expect(received).toHaveLength(1);
    expect(received[0].batchId).toMatch(/^batch-/);
  });

  test("resetBatch clears pending events", () => {
    addToBatch(makeEntry("y"));
    resetBatch();
    expect(pendingCount()).toBe(0);
  });
});
