import { describe, it, expect, beforeEach } from "vitest";
import { IncomingMessage, ServerResponse } from "http";
import { Socket } from "net";
import { tryCorrelationRoute, isCorrelationRoute } from "./webhookCorrelationRoute";
import { recordCorrelation, clearCorrelations } from "./webhookCorrelation";

function makeReq(method: string, url: string): IncomingMessage {
  const req = new IncomingMessage(new Socket());
  req.method = method;
  req.url = url;
  return req;
}

function makeRes(): { res: ServerResponse; status: () => number; body: () => string } {
  let statusCode = 200;
  let body = "";
  const res = {
    writeHead: (s: number) => { statusCode = s; },
    end: (b: string) => { body = b; },
  } as unknown as ServerResponse;
  return { res, status: () => statusCode, body: () => body };
}

beforeEach(() => {
  clearCorrelations();
});

describe("isCorrelationRoute", () => {
  it("matches /admin/correlations", () => {
    expect(isCorrelationRoute(makeReq("GET", "/admin/correlations"))).toBe(true);
  });

  it("matches /admin/correlations/:id", () => {
    expect(isCorrelationRoute(makeReq("GET", "/admin/correlations/abc123"))).toBe(true);
  });

  it("does not match /admin/other", () => {
    expect(isCorrelationRoute(makeReq("GET", "/admin/other"))).toBe(false);
  });
});

describe("tryCorrelationRoute", () => {
  it("lists all correlations", () => {
    recordCorrelation("corr-1", "req-a", { path: "/hook" });
    const { res, status, body } = makeRes();
    const handled = tryCorrelationRoute(makeReq("GET", "/admin/correlations"), res);
    expect(handled).toBe(true);
    expect(status()).toBe(200);
    const parsed = JSON.parse(body());
    expect(parsed.correlations).toBeDefined();
  });

  it("returns correlated requests for a known ID", () => {
    recordCorrelation("corr-2", "req-b", { path: "/hook" });
    const { res, status, body } = makeRes();
    tryCorrelationRoute(makeReq("GET", "/admin/correlations/corr-2"), res);
    expect(status()).toBe(200);
    const parsed = JSON.parse(body());
    expect(parsed.correlationId).toBe("corr-2");
    expect(parsed.requests.length).toBeGreaterThan(0);
  });

  it("returns 404 for unknown correlation ID", () => {
    const { res, status } = makeRes();
    tryCorrelationRoute(makeReq("GET", "/admin/correlations/unknown-id"), res);
    expect(status()).toBe(404);
  });

  it("clears all correlations on DELETE", () => {
    recordCorrelation("corr-3", "req-c", { path: "/hook" });
    const { res, status } = makeRes();
    tryCorrelationRoute(makeReq("DELETE", "/admin/correlations"), res);
    expect(status()).toBe(200);
    const { res: res2, body } = makeRes();
    tryCorrelationRoute(makeReq("GET", "/admin/correlations"), res2);
    const parsed = JSON.parse(body());
    expect(parsed.correlations.length).toBe(0);
  });

  it("returns false for unrelated routes", () => {
    const { res } = makeRes();
    const handled = tryCorrelationRoute(makeReq("GET", "/admin/other"), res);
    expect(handled).toBe(false);
  });
});
