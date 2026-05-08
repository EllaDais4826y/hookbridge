import { describe, it, expect, beforeEach } from "vitest";
import { EventEmitter } from "events";
import {
  configurePayloadSize,
  resetPayloadSizeOptions,
  getPayloadSizeOptions,
  createPayloadSizeMiddleware,
} from "./payloadSize";

function makeReq(contentLength?: number): any {
  const emitter = new EventEmitter() as any;
  emitter.headers = contentLength !== undefined
    ? { "content-length": String(contentLength) }
    : {};
  emitter.destroy = () => {};
  return emitter;
}

function makeRes(): any {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: "",
    writeHead(code: number, headers?: Record<string, string>) {
      res.statusCode = code;
      if (headers) Object.assign(res.headers, headers);
    },
    end(data?: string) {
      res.body = data ?? "";
    },
  };
  return res;
}

beforeEach(() => {
  resetPayloadSizeOptions();
});

describe("configurePayloadSize / getPayloadSizeOptions", () => {
  it("returns default max bytes", () => {
    expect(getPayloadSizeOptions().maxBytes).toBe(1024 * 256);
  });

  it("updates options", () => {
    configurePayloadSize({ maxBytes: 512 });
    expect(getPayloadSizeOptions().maxBytes).toBe(512);
  });
});

describe("createPayloadSizeMiddleware", () => {
  it("calls next when content-length is within limit", () => {
    const mw = createPayloadSizeMiddleware({ maxBytes: 1000 });
    const req = makeReq(500);
    const res = makeRes();
    let called = false;
    mw(req, res, () => { called = true; });
    req.emit("end");
    expect(called).toBe(true);
    expect(res.statusCode).toBe(200);
  });

  it("rejects immediately when content-length exceeds limit", () => {
    const mw = createPayloadSizeMiddleware({ maxBytes: 100 });
    const req = makeReq(200);
    const res = makeRes();
    let called = false;
    mw(req, res, () => { called = true; });
    expect(called).toBe(false);
    expect(res.statusCode).toBe(413);
    const parsed = JSON.parse(res.body);
    expect(parsed.error).toBe("Payload Too Large");
    expect(parsed.maxBytes).toBe(100);
  });

  it("rejects mid-stream when chunks exceed limit", () => {
    const mw = createPayloadSizeMiddleware({ maxBytes: 10 });
    const req = makeReq();
    const res = makeRes();
    let called = false;
    mw(req, res, () => { called = true; });
    req.emit("data", Buffer.alloc(11));
    expect(called).toBe(false);
    expect(res.statusCode).toBe(413);
  });

  it("calls next when no content-length and data is within limit", () => {
    const mw = createPayloadSizeMiddleware({ maxBytes: 100 });
    const req = makeReq();
    const res = makeRes();
    let called = false;
    mw(req, res, () => { called = true; });
    req.emit("data", Buffer.alloc(50));
    req.emit("end");
    expect(called).toBe(true);
  });

  it("uses global options when no local opts provided", () => {
    configurePayloadSize({ maxBytes: 50 });
    const mw = createPayloadSizeMiddleware();
    const req = makeReq(100);
    const res = makeRes();
    mw(req, res, () => {});
    expect(res.statusCode).toBe(413);
  });
});
