import { describe, it, expect, vi, beforeEach } from "vitest";
import { IncomingMessage, ServerResponse } from "http";
import { tryReplayRoute, isReplayRoute } from "./replayRoute";
import * as replayHandlerModule from "./replayHandler";

function makeReq(url: string, method = "POST"): IncomingMessage {
  return { url, method } as IncomingMessage;
}

function makeRes(): ServerResponse {
  const res = {
    writeHead: vi.fn(),
    end: vi.fn(),
  } as unknown as ServerResponse;
  return res;
}

const mockConfig = { targets: [] } as any;
const mockLogger = { info: vi.fn(), error: vi.fn() } as any;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("isReplayRoute", () => {
  it("returns true for exact path", () => {
    expect(isReplayRoute(makeReq("/_hookbridge/replay"))).toBe(true);
  });

  it("returns true for path with query string", () => {
    expect(isReplayRoute(makeReq("/_hookbridge/replay?foo=bar"))).toBe(true);
  });

  it("returns false for unrelated path", () => {
    expect(isReplayRoute(makeReq("/webhook"))).toBe(false);
  });

  it("returns false for partial match", () => {
    expect(isReplayRoute(makeReq("/_hookbridge/replaying"))).toBe(false);
  });
});

describe("tryReplayRoute", () => {
  it("returns false and does not call handler for non-replay path", async () => {
    const spy = vi.spyOn(replayHandlerModule, "replayHandler");
    const req = makeReq("/other");
    const res = makeRes();
    const result = await tryReplayRoute(req, res, mockConfig, mockLogger);
    expect(result).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns true and calls handler for replay path", async () => {
    const spy = vi
      .spyOn(replayHandlerModule, "replayHandler")
      .mockResolvedValue(undefined);
    const req = makeReq("/_hookbridge/replay");
    const res = makeRes();
    const result = await tryReplayRoute(req, res, mockConfig, mockLogger);
    expect(result).toBe(true);
    expect(spy).toHaveBeenCalledWith(req, res, mockConfig, mockLogger);
  });

  it("passes through to handler with query string path", async () => {
    const spy = vi
      .spyOn(replayHandlerModule, "replayHandler")
      .mockResolvedValue(undefined);
    const req = makeReq("/_hookbridge/replay?dry=true");
    const res = makeRes();
    const result = await tryReplayRoute(req, res, mockConfig, mockLogger);
    expect(result).toBe(true);
    expect(spy).toHaveBeenCalledOnce();
  });
});
