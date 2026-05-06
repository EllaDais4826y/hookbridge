import { healthHandler } from "./healthHandler";
import { resetMetrics, recordRequest, recordFanoutResult } from "./metrics";
import { IncomingMessage, ServerResponse } from "http";

function makeRes() {
  const headers: Record<string, string | number> = {};
  let statusCode = 0;
  let body = "";
  return {
    writeHead(code: number, hdrs: Record<string, string | number>) {
      statusCode = code;
      Object.assign(headers, hdrs);
    },
    end(data: string) {
      body = data;
    },
    get statusCode() {
      return statusCode;
    },
    get body() {
      return body;
    },
    get headers() {
      return headers;
    },
  } as unknown as ServerResponse & { body: string; headers: Record<string, string | number> };
}

beforeEach(() => {
  resetMetrics();
});

test("returns 200 and ok status when no requests recorded", () => {
  const res = makeRes();
  healthHandler({} as IncomingMessage, res);
  expect(res.statusCode).toBe(200);
  const parsed = JSON.parse(res.body);
  expect(parsed.status).toBe("ok");
  expect(parsed.metrics.totalRequests).toBe(0);
  expect(parsed.metrics.successRate).toBe("100.00%");
});

test("returns 200 and ok when success rate is high", () => {
  recordRequest();
  recordFanoutResult(true);
  const res = makeRes();
  healthHandler({} as IncomingMessage, res);
  expect(res.statusCode).toBe(200);
  const parsed = JSON.parse(res.body);
  expect(parsed.status).toBe("ok");
});

test("returns 503 and degraded when failure rate exceeds 50%", () => {
  recordRequest();
  recordFanoutResult(false);
  recordRequest();
  recordFanoutResult(false);
  recordRequest();
  recordFanoutResult(true);
  const res = makeRes();
  healthHandler({} as IncomingMessage, res);
  expect(res.statusCode).toBe(503);
  const parsed = JSON.parse(res.body);
  expect(parsed.status).toBe("degraded");
});

test("response includes uptime and timestamp", () => {
  const res = makeRes();
  healthHandler({} as IncomingMessage, res);
  const parsed = JSON.parse(res.body);
  expect(typeof parsed.uptime).toBe("number");
  expect(parsed.uptime).toBeGreaterThanOrEqual(0);
  expect(typeof parsed.timestamp).toBe("string");
  expect(new Date(parsed.timestamp).toString()).not.toBe("Invalid Date");
});

test("sets correct content-type header", () => {
  const res = makeRes();
  healthHandler({} as IncomingMessage, res);
  expect(res.headers["Content-Type"]).toBe("application/json");
});
