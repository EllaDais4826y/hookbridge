import { tryHealthRoute } from "./healthRoute";
import { resetMetrics } from "./metrics";
import { IncomingMessage, ServerResponse } from "http";

function makeReq(method: string, url: string): IncomingMessage {
  return { method, url } as IncomingMessage;
}

function makeRes() {
  let statusCode = 0;
  let body = "";
  return {
    writeHead(code: number) {
      statusCode = code;
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
  } as unknown as ServerResponse & { body: string };
}

beforeEach(() => {
  resetMetrics();
});

test("handles GET /health and returns true", () => {
  const req = makeReq("GET", "/health");
  const res = makeRes();
  const handled = tryHealthRoute(req, res);
  expect(handled).toBe(true);
  expect(res.statusCode).toBe(200);
  const parsed = JSON.parse(res.body);
  expect(parsed.status).toBe("ok");
});

test("does not handle POST /health", () => {
  const req = makeReq("POST", "/health");
  const res = makeRes();
  const handled = tryHealthRoute(req, res);
  expect(handled).toBe(false);
  expect(res.statusCode).toBe(0);
});

test("does not handle GET /other", () => {
  const req = makeReq("GET", "/other");
  const res = makeRes();
  const handled = tryHealthRoute(req, res);
  expect(handled).toBe(false);
});

test("does not handle GET /healthz", () => {
  const req = makeReq("GET", "/healthz");
  const res = makeRes();
  const handled = tryHealthRoute(req, res);
  expect(handled).toBe(false);
});
