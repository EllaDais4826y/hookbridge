import type { IncomingMessage, ServerResponse } from "http";
import { addTenant, clearTenants } from "./tenantRouter";
import { createTenantMiddleware } from "./tenantMiddleware";

beforeEach(() => clearTenants());

function makeReq(
  headers: Record<string, string> = {}
): IncomingMessage & { resolvedEndpoints?: string[] } {
  return { headers } as unknown as IncomingMessage & {
    resolvedEndpoints?: string[];
  };
}

const makeRes = () => ({} as ServerResponse);

describe("createTenantMiddleware", () => {
  const fallback = ["https://fallback.example.com"];

  it("resolves tenant endpoints when tenant header present", (done) => {
    addTenant({
      tenantId: "acme",
      endpoints: ["https://acme.example.com"],
    });

    const mw = createTenantMiddleware({ fallbackEndpoints: fallback });
    const req = makeReq({ "x-tenant-id": "acme" });

    mw(req, makeRes(), () => {
      expect(req.resolvedEndpoints).toEqual(["https://acme.example.com"]);
      done();
    });
  });

  it("falls back when tenant header is missing", (done) => {
    const mw = createTenantMiddleware({ fallbackEndpoints: fallback });
    const req = makeReq();

    mw(req, makeRes(), () => {
      expect(req.resolvedEndpoints).toEqual(fallback);
      done();
    });
  });

  it("falls back when tenant id not registered", (done) => {
    const mw = createTenantMiddleware({ fallbackEndpoints: fallback });
    const req = makeReq({ "x-tenant-id": "unknown" });

    mw(req, makeRes(), () => {
      expect(req.resolvedEndpoints).toEqual(fallback);
      done();
    });
  });

  it("respects custom header name", (done) => {
    addTenant({ tenantId: "beta", endpoints: ["https://beta.example.com"] });

    const mw = createTenantMiddleware({
      fallbackEndpoints: fallback,
      headerName: "x-org",
    });
    const req = makeReq({ "x-org": "beta" });

    mw(req, makeRes(), () => {
      expect(req.resolvedEndpoints).toEqual(["https://beta.example.com"]);
      done();
    });
  });
});
