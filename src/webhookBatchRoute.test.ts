import { IncomingMessage, ServerResponse } from "http";
import { isBatchRoute, tryBatchRoute } from "./webhookBatchRoute";
import { resetBatch, addToBatch } from "./webhookBatch";
import { EventEmitter } from "events";

function makeReq(
  url: string,
  method = "GET",
  body = ""
): IncomingMessage {
  const req = new EventEmitter() as IncomingMessage;
  req.url = url;
  req.method = method;
  req.headers = {};
  setImmediate(() => {
    req.emit("data", Buffer.from(body));
    req.emit("end");
  });
  return req;
}

function makeRes(): { res: ServerResponse; status: number | null; body: string } {
  const ctx = { status: null as number | null, body: "" };
  const res = {
    writeHead(s: number) { ctx.status = s; },
    end(b: string) { ctx.body = b; },
  } as unknown as ServerResponse;
  return { res, ...ctx, get status() { return ctx.status; }, get body() { return ctx.body; } };
}

describe("isBatchRoute", () => {
  test("matches batch paths", () => {
    expect(isBatchRoute(makeReq("/_hookbridge/batch/flush"))).toBe(true);
    expect(isBatchRoute(makeReq("/_hookbridge/batch/status"))).toBe(true);
  });

  test("does not match other paths", () => {
    expect(isBatchRoute(makeReq("/webhook"))).toBe(false);
  });
});

describe("tryBatchRoute – status", () => {
  beforeEach(() => resetBatch());

  test("GET /_hookbridge/batch/status returns pending count", (done) => {
    const req = makeReq("/_hookbridge/batch/status", "GET");
    const ctx = makeRes();
    const handled = tryBatchRoute(req, ctx.res);
    expect(handled).toBe(true);
    setImmediate(() => {
      const parsed = JSON.parse(ctx.body);
      expect(parsed.pending).toBe(0);
      expect(parsed.options).toBeDefined();
      done();
    });
  });
});

describe("tryBatchRoute – flush", () => {
  beforeEach(() => resetBatch());

  test("POST /_hookbridge/batch/flush with no events", (done) => {
    const req = makeReq("/_hookbridge/batch/flush", "POST");
    const ctx = makeRes();
    tryBatchRoute(req, ctx.res);
    setImmediate(() => {
      const parsed = JSON.parse(ctx.body);
      expect(parsed.flushed).toBe(false);
      done();
    });
  });

  test("POST /_hookbridge/batch/flush with events", (done) => {
    addToBatch({ id: "e1", receivedAt: new Date().toISOString(), body: {}, headers: {} });
    const req = makeReq("/_hookbridge/batch/flush", "POST");
    const ctx = makeRes();
    tryBatchRoute(req, ctx.res);
    setImmediate(() => {
      const parsed = JSON.parse(ctx.body);
      expect(parsed.flushed).toBe(true);
      expect(parsed.batch.events).toHaveLength(1);
      done();
    });
  });
});

describe("tryBatchRoute – config", () => {
  beforeEach(() => resetBatch());

  test("POST /_hookbridge/batch/config updates options", (done) => {
    const req = makeReq("/_hookbridge/batch/config", "POST", JSON.stringify({ maxSize: 25 }));
    const ctx = makeRes();
    tryBatchRoute(req, ctx.res);
    setTimeout(() => {
      const parsed = JSON.parse(ctx.body);
      expect(parsed.updated).toBe(true);
      expect(parsed.options.maxSize).toBe(25);
      done();
    }, 20);
  });

  test("returns false for unknown routes", () => {
    const req = makeReq("/_hookbridge/batch/unknown", "DELETE");
    const ctx = makeRes();
    expect(tryBatchRoute(req, ctx.res)).toBe(false);
  });
});
