import { describe, it, expect, beforeEach } from "vitest";
import {
  headerMatches,
  pickHeaders,
  createHeaderForwardMiddleware,
} from "./headerForward";
import { IncomingMessage, ServerResponse } from "http";

describe("headerMatches", () => {
  it("matches exact header name (case-insensitive)", () => {
    expect(headerMatches("X-Request-Id", ["x-request-id"])).toBe(true);
    expect(headerMatches("X-Request-Id", ["X-Request-ID"])).toBe(true);
  });

  it("does not match unrelated header", () => {
    expect(headerMatches("authorization", ["x-request-id"])).toBe(false);
  });

  it("matches wildcard *", () => {
    expect(headerMatches("anything", ["*"])).toBe(true);
  });

  it("matches prefix wildcard", () => {
    expect(headerMatches("x-custom-foo", ["x-custom-*"])).toBe(true);
    expect(headerMatches("x-other", ["x-custom-*"])).toBe(false);
  });

  it("returns false for empty patterns", () => {
    expect(headerMatches("content-type", [])).toBe(false);
  });
});

describe("pickHeaders", () => {
  it("returns only matching headers", () => {
    const headers = {
      "x-request-id": "abc123",
      "content-type": "application/json",
      authorization: "Bearer token",
    };
    const result = pickHeaders(headers, ["x-request-id", "content-type"]);
    expect(result).toEqual({
      "x-request-id": "abc123",
      "content-type": "application/json",
    });
    expect(result["authorization"]).toBeUndefined();
  });

  it("joins array header values with comma", () => {
    const headers = { accept: ["text/html", "application/json"] };
    const result = pickHeaders(headers, ["accept"]);
    expect(result["accept"]).toBe("text/html, application/json");
  });

  it("skips undefined values", () => {
    const headers: Record<string, string | undefined> = { "x-foo": undefined };
    const result = pickHeaders(headers, ["x-foo"]);
    expect(result["x-foo"]).toBeUndefined();
  });
});

describe("createHeaderForwardMiddleware", () => {
  const makeReq = (headers: Record<string, string>) =>
    ({ headers } as unknown as IncomingMessage & { forwardedHeaders?: Record<string, string> });
  const makeRes = () => ({} as ServerResponse);

  it("attaches matching headers to req.forwardedHeaders", () => {
    const middleware = createHeaderForwardMiddleware(["x-trace-*"]);
    const req = makeReq({ "x-trace-id": "t1", "content-type": "text/plain" });
    let called = false;
    middleware(req, makeRes(), () => { called = true; });
    expect(called).toBe(true);
    expect(req.forwardedHeaders).toEqual({ "x-trace-id": "t1" });
  });

  it("sets empty object when patterns list is empty", () => {
    const middleware = createHeaderForwardMiddleware([]);
    const req = makeReq({ "x-request-id": "r1" });
    middleware(req, makeRes(), () => {});
    expect(req.forwardedHeaders).toEqual({});
  });

  it("calls next regardless", () => {
    const middleware = createHeaderForwardMiddleware(["*"]);
    const req = makeReq({});
    let nextCalled = false;
    middleware(req, makeRes(), () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
  });
});
