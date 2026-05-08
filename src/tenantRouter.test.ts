import {
  addTenant,
  removeTenant,
  getTenant,
  listTenants,
  clearTenants,
  resolveEndpoints,
  extractTenantId,
} from "./tenantRouter";

beforeEach(() => clearTenants());

describe("addTenant / getTenant", () => {
  it("stores and retrieves a tenant", () => {
    addTenant({ tenantId: "acme", endpoints: ["https://a.example.com"] });
    expect(getTenant("acme")).toEqual({
      tenantId: "acme",
      endpoints: ["https://a.example.com"],
    });
  });

  it("returns undefined for unknown tenant", () => {
    expect(getTenant("ghost")).toBeUndefined();
  });

  it("returns a copy, not a reference", () => {
    addTenant({ tenantId: "t1", endpoints: ["https://ep1.example.com"] });
    const t = getTenant("t1")!;
    t.endpoints.push("https://mutated.example.com");
    expect(getTenant("t1")!.endpoints).toHaveLength(1);
  });
});

describe("removeTenant", () => {
  it("removes an existing tenant", () => {
    addTenant({ tenantId: "x", endpoints: [] });
    expect(removeTenant("x")).toBe(true);
    expect(getTenant("x")).toBeUndefined();
  });

  it("returns false for non-existent tenant", () => {
    expect(removeTenant("nope")).toBe(false);
  });
});

describe("listTenants", () => {
  it("lists all tenants", () => {
    addTenant({ tenantId: "a", endpoints: [] });
    addTenant({ tenantId: "b", endpoints: [] });
    const ids = listTenants().map((t) => t.tenantId).sort();
    expect(ids).toEqual(["a", "b"]);
  });
});

describe("resolveEndpoints", () => {
  it("returns tenant endpoints when tenant exists", () => {
    addTenant({ tenantId: "t", endpoints: ["https://t.example.com"] });
    expect(resolveEndpoints("t", ["https://fallback.example.com"])).toEqual([
      "https://t.example.com",
    ]);
  });

  it("returns fallback when tenant not found", () => {
    expect(resolveEndpoints("missing", ["https://fb.example.com"])).toEqual([
      "https://fb.example.com",
    ]);
  });
});

describe("extractTenantId", () => {
  it("extracts from string header", () => {
    expect(extractTenantId({ "x-tenant-id": "acme" })).toBe("acme");
  });

  it("extracts first value from array header", () => {
    expect(extractTenantId({ "x-tenant-id": ["first", "second"] })).toBe(
      "first"
    );
  });

  it("returns undefined when header missing", () => {
    expect(extractTenantId({})).toBeUndefined();
  });

  it("supports custom header name", () => {
    expect(
      extractTenantId({ "x-org": "orgA" }, "x-org")
    ).toBe("orgA");
  });
});
