import { describe, it, expect, beforeEach } from "vitest";
import { IncomingMessage, ServerResponse } from "http";
import {
  isEventAllowed,
  createEventFilterMiddleware,
} from "./eventFilter";

function makeReq(headers: Record<string, string> = {}): IncomingMessage {
  return { headers } as unknown as IncomingMessage;
}

function makeRes() {
  const res = {
    statusCode: 200,
    _headers: {} as Record<string, string>,
    _body: "",
    writeHead(code: number, headers?: Record<string, string>) {
      res.statusCode = code;
      Object.assign(res._headers, headers ?? {});
    },
    end(body: string) {
      res._body = body;
    },
  };
  return res as unknown as ServerResponse & { statusCode: number; _body: string };
}

describe("isEventAllowed", () => {
  it("allows everything when list is empty", () => {
    expect(isEventAllowed("push", [])).toBe(true);
    expect(isEventAllowed(undefined, [])).toBe(true);
  });

  it("blocks undefined event when list is non-empty", () => {
    expect(isEventAllowed(undefined, ["push"])).toBe(false);
  });

  it("allows matching event (case-insensitive)", () => {
    expect(isEventAllowed("PUSH", ["push"])).toBe(true);
  });

  it("blocks non-matching event", () => {
    expect(isEventAllowed("delete", ["push", "pull_request"])).toBe(false);
  });
});

describe("createEventFilterMiddleware", () => {
  const next = () => {};

  it("calls next when event is allowed", () => {
    const middleware = createEventFilterMiddleware({
      headerName: "x-github-event",
      allowedEvents: ["push"],
    });
    let called = false;
    const req = makeReq({ "x-github-event": "push" });
    const res = makeRes();
    middleware(req, res, () => { called = true; });
    expect(called).toBe(true);
  });

  it("returns 422 when event is blocked", () => {
    const middleware = createEventFilterMiddleware({
      headerName: "x-github-event",
      allowedEvents: ["push"],
    });
    const req = makeReq({ "x-github-event": "delete" });
    const res = makeRes();
    middleware(req, res, next);
    expect(res.statusCode).toBe(422);
    const body = JSON.parse(res._body);
    expect(body.error).toBe("event_type_not_allowed");
    expect(body.received).toBe("delete");
  });

  it("returns 422 when header is missing and list is non-empty", () => {
    const middleware = createEventFilterMiddleware({
      headerName: "x-github-event",
      allowedEvents: ["push"],
    });
    const req = makeReq({});
    const res = makeRes();
    middleware(req, res, next);
    expect(res.statusCode).toBe(422);
    const body = JSON.parse(res._body);
    expect(body.received).toBeNull();
  });

  it("calls next when allowed list is empty (allow all)", () => {
    const middleware = createEventFilterMiddleware({
      headerName: "x-github-event",
      allowedEvents: [],
    });
    let called = false;
    const req = makeReq({});
    const res = makeRes();
    middleware(req, res, () => { called = true; });
    expect(called).toBe(true);
  });
});
