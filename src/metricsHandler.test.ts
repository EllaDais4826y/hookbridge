import type { IncomingMessage, ServerResponse } from "node:http";
import { metricsHandler } from "./metricsHandler";
import { resetMetrics, recordRequest, recordRetry } from "./metrics";

function makeRes() {
  const headers: Record<string, string | number> = {};
  let statusCode = 0;
  let body = "";
  const res = {
    writeHead(code: number, hdrs: Record<string, string | number>) {
      statusCode = code;
      Object.assign(headers, hdrs);
    },
    end(chunk: string) {
      body = chunk;
    },
    get statusCode() {
      return statusCode;
    },
    get headers() {
      return headers;
    },
    get body() {
      return body;
    },
  } as unknown as ServerResponse & { headers: typeof headers; body: string };
  return res;
}

beforeEach(() => {
  resetMetrics();
});

test("responds with 200 and JSON content-type", () => {
  const res = makeRes();
  metricsHandler({} as IncomingMessage, res);
  expect(res.statusCode).toBe(200);
  expect((res as any).headers["Content-Type"]).toBe("application/json");
});

test("body is valid JSON matching current metrics", () => {
  recordRequest();
  recordRetry();
  const res = makeRes();
  metricsHandler({} as IncomingMessage, res);
  const parsed = JSON.parse((res as any).body);
  expect(parsed.totalRequests).toBe(1);
  expect(parsed.totalRetries).toBe(1);
  expect(parsed.successfulFanouts).toBe(0);
});

test("Content-Length matches body byte length", () => {
  const res = makeRes();
  metricsHandler({} as IncomingMessage, res);
  const body = (res as any).body as string;
  expect((res as any).headers["Content-Length"]).toBe(
    Buffer.byteLength(body)
  );
});
