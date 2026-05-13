import { IncomingMessage, ServerResponse } from "http";
import { isMuteRoute, tryMuteRoute, checkEndpointMuted } from "./webhookMuteRoute";
import { muteTarget, unmuteTarget, clearMuted } from "./webhookMute";

function makeReq(method: string, url: string, body = ""): IncomingMessage {
  const req = Object.assign(Object.create(IncomingMessage.prototype), {
    method,
    url,
    headers: { "content-type": "application/json" },
  }) as IncomingMessage;
  (req as any)._body = body;
  req.on = (event: string, cb: (...args: any[]) => void) => {
    if (event === "data") cb(Buffer.from(body));
    if (event === "end") cb();
    return req;
  };
  return req;
}

function makeRes(): ServerResponse {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: "",
    setHeader(k: string, v: string) { this.headers[k] = v; },
    end(data?: string) { this.body = data ?? ""; },
    writeHead(code: number) { this.statusCode = code; },
  } as unknown as ServerResponse;
  return res;
}

beforeEach(() => clearMuted());

test("isMuteRoute matches /admin/mute paths", () => {
  expect(isMuteRoute(makeReq("GET", "/admin/mute"))).toBe(true);
  expect(isMuteRoute(makeReq("GET", "/admin/mute/some-target"))).toBe(true);
  expect(isMuteRoute(makeReq("GET", "/admin/other"))).toBe(false);
});

test("tryMuteRoute returns false for non-mute routes", async () => {
  const req = makeReq("GET", "/admin/other");
  const res = makeRes();
  const handled = await tryMuteRoute(req, res);
  expect(handled).toBe(false);
});

test("tryMuteRoute returns true for mute routes", async () => {
  const req = makeReq("GET", "/admin/mute");
  const res = makeRes();
  const handled = await tryMuteRoute(req, res);
  expect(handled).toBe(true);
});

test("checkEndpointMuted returns false when not muted", () => {
  expect(checkEndpointMuted("https://example.com")).toBe(false);
});

test("checkEndpointMuted returns true when muted", () => {
  muteTarget("https://example.com", "test");
  expect(checkEndpointMuted("https://example.com")).toBe(true);
  unmuteTarget("https://example.com");
  expect(checkEndpointMuted("https://example.com")).toBe(false);
});
