import { describe, it, expect, beforeEach } from "vitest";
import { IncomingMessage, ServerResponse } from "http";
import { clearSecrets, addSecret } from "./webhookSecret.js";
import { isWebhookSecretRoute, tryWebhookSecretRoute } from "./webhookSecretRoute.js";

beforeEach(() => clearSecrets());

function makeReq(method: string, url: string, body = ""): IncomingMessage {
  const req = Object.assign(Object.create(IncomingMessage.prototype), {
    method,
    url,
    headers: {},
  }) as IncomingMessage;
  (req as any)._body = body;
  req.on = (event: string, cb: (...args: any[]) => void) => {
    if (event === "data") cb(Buffer.from(body));
    if (event === "end") cb();
    return req;
  };
  return req;
}

function makeRes(): { res: ServerResponse; status: () => number; body: () => string } {
  let statusCode = 200;
  let body = "";
  const res = {
    writeHead(s: number) { statusCode = s; },
    end(b: string) { body = b; },
  } as unknown as ServerResponse;
  return { res, status: () => statusCode, body: () => body };
}

describe("isWebhookSecretRoute", () => {
  it("matches /admin/secrets", () => {
    expect(isWebhookSecretRoute(makeReq("GET", "/admin/secrets"))).toBe(true);
  });

  it("matches /admin/secrets/:name", () => {
    expect(isWebhookSecretRoute(makeReq("GET", "/admin/secrets/primary"))).toBe(true);
  });

  it("does not match unrelated routes", () => {
    expect(isWebhookSecretRoute(makeReq("GET", "/admin/metrics"))).toBe(false);
  });
});

describe("tryWebhookSecretRoute", () => {
  it("returns false for non-matching routes", async () => {
    const req = makeReq("GET", "/other");
    const { res } = makeRes();
    expect(await tryWebhookSecretRoute(req, res)).toBe(false);
  });

  it("lists secrets on GET /admin/secrets", async () => {
    addSecret("main", "abc");
    const req = makeReq("GET", "/admin/secrets");
    const { res, status, body } = makeRes();
    const handled = await tryWebhookSecretRoute(req, res);
    expect(handled).toBe(true);
    expect(status()).toBe(200);
    const parsed = JSON.parse(body());
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].name).toBe("main");
  });

  it("creates a secret on POST /admin/secrets", async () => {
    const payload = JSON.stringify({ name: "key", secret: "val" });
    const req = makeReq("POST", "/admin/secrets", payload);
    const { res, status, body } = makeRes();
    await tryWebhookSecretRoute(req, res);
    expect(status()).toBe(201);
    expect(JSON.parse(body()).name).toBe("key");
  });

  it("clears secrets on DELETE /admin/secrets", async () => {
    addSecret("x", "1");
    const req = makeReq("DELETE", "/admin/secrets");
    const { res, status, body } = makeRes();
    await tryWebhookSecretRoute(req, res);
    expect(status()).toBe(200);
    expect(JSON.parse(body()).cleared).toBe(true);
  });
});
