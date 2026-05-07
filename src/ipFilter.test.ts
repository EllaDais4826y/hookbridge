import { isIpAllowed, createIpFilterMiddleware, IpFilterConfig } from "./ipFilter";

describe("isIpAllowed", () => {
  it("allows all IPs when no config provided", () => {
    expect(isIpAllowed("1.2.3.4", {})).toBe(true);
  });

  it("blocks IP on denylist (exact match)", () => {
    expect(isIpAllowed("10.0.0.1", { denylist: ["10.0.0.1"] })).toBe(false);
  });

  it("allows IP not on denylist", () => {
    expect(isIpAllowed("10.0.0.2", { denylist: ["10.0.0.1"] })).toBe(true);
  });

  it("blocks IP matching CIDR denylist", () => {
    expect(isIpAllowed("192.168.1.50", { denylist: ["192.168.1.0/24"] })).toBe(false);
  });

  it("allows IP not matching CIDR denylist", () => {
    expect(isIpAllowed("192.168.2.1", { denylist: ["192.168.1.0/24"] })).toBe(true);
  });

  it("allows IP on allowlist", () => {
    expect(isIpAllowed("10.0.0.5", { allowlist: ["10.0.0.5"] })).toBe(true);
  });

  it("blocks IP not on allowlist", () => {
    expect(isIpAllowed("10.0.0.6", { allowlist: ["10.0.0.5"] })).toBe(false);
  });

  it("allows IP matching CIDR allowlist", () => {
    expect(isIpAllowed("172.16.0.10", { allowlist: ["172.16.0.0/16"] })).toBe(true);
  });

  it("denylist takes precedence over allowlist", () => {
    const config: IpFilterConfig = {
      allowlist: ["10.0.0.1"],
      denylist: ["10.0.0.1"],
    };
    expect(isIpAllowed("10.0.0.1", config)).toBe(false);
  });

  it("handles /0 CIDR (match all)", () => {
    expect(isIpAllowed("8.8.8.8", { denylist: ["0.0.0.0/0"] })).toBe(false);
  });
});

describe("createIpFilterMiddleware", () => {
  function makeReq(ip: string, forwarded?: string): any {
    return {
      headers: forwarded ? { "x-forwarded-for": forwarded } : {},
      socket: { remoteAddress: ip },
    };
  }

  function makeRes(): any {
    const res: any = { statusCode: 200, body: "" };
    res.writeHead = (code: number, _headers?: any) => { res.statusCode = code; };
    res.end = (body: string) => { res.body = body; };
    return res;
  }

  it("calls next when IP is allowed", () => {
    const mw = createIpFilterMiddleware({ allowlist: ["127.0.0.1"] });
    const req = makeReq("127.0.0.1");
    const res = makeRes();
    let called = false;
    mw(req, res, () => { called = true; });
    expect(called).toBe(true);
  });

  it("returns 403 when IP is blocked", () => {
    const mw = createIpFilterMiddleware({ denylist: ["10.0.0.1"] });
    const req = makeReq("10.0.0.1");
    const res = makeRes();
    let called = false;
    mw(req, res, () => { called = true; });
    expect(called).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it("uses x-forwarded-for header when present", () => {
    const mw = createIpFilterMiddleware({ denylist: ["203.0.113.5"] });
    const req = makeReq("127.0.0.1", "203.0.113.5, 10.0.0.1");
    const res = makeRes();
    let called = false;
    mw(req, res, () => { called = true; });
    expect(called).toBe(false);
    expect(res.statusCode).toBe(403);
  });
});
