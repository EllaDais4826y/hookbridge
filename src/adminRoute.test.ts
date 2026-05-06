import { IncomingMessage, ServerResponse } from "http";
import { tryAdminRoute } from "./adminRoute";
import { resetMetrics, recordRequest, getMetrics } from "./metrics";
import { createLogger } from "./logger";

function makeReq(method: string, url: string): IncomingMessage {
  return { method, url } as unknown as IncomingMessage;
}

function makeRes(): {
  res: ServerResponse;
  status: () => number | undefined;
  body: () => string;
} {
  let statusCode: number | undefined;
  let body = "";
  const headers: Record<string, string> = {};
  const res = {
    writeHead(code: number, hdrs?: Record<string, string>) {
      statusCode = code;
      Object.assign(headers, hdrs ?? {});
    },
    end(chunk: string) {
      body = chunk;
    },
  } as unknown as ServerResponse;
  return { res, status: () => statusCode, body: () => body };
}

const logger = createLogger({ level: "silent" } as never, { write: () => {} });

beforeEach(() => {
  resetMetrics();
});

describe("tryAdminRoute", () => {
  it("returns false for non-admin routes", () => {
    const req = makeReq("GET", "/webhook");
    const { res } = makeRes();
    expect(tryAdminRoute(req, res, logger)).toBe(false);
  });

  it("resets metrics on POST /admin/reset-metrics", () => {
    recordRequest();
    recordRequest();
    expect(getMetrics().totalRequests).toBe(2);

    const req = makeReq("POST", "/admin/reset-metrics");
    const { res, status, body } = makeRes();
    const handled = tryAdminRoute(req, res, logger);

    expect(handled).toBe(true);
    expect(status()).toBe(200);
    const parsed = JSON.parse(body());
    expect(parsed.ok).toBe(true);
    expect(getMetrics().totalRequests).toBe(0);
  });

  it("returns 404 for unknown admin sub-routes", () => {
    const req = makeReq("GET", "/admin/unknown");
    const { res, status, body } = makeRes();
    const handled = tryAdminRoute(req, res, logger);

    expect(handled).toBe(true);
    expect(status()).toBe(404);
    const parsed = JSON.parse(body());
    expect(parsed.ok).toBe(false);
  });

  it("does not reset metrics on GET /admin/reset-metrics", () => {
    recordRequest();
    const req = makeReq("GET", "/admin/reset-metrics");
    const { res, status } = makeRes();
    tryAdminRoute(req, res, logger);
    // GET on that path falls to the unknown-admin 404 handler
    expect(status()).toBe(404);
    expect(getMetrics().totalRequests).toBe(1);
  });
});
