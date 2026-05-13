import {
  generateCorrelationId,
  recordCorrelation,
  getCorrelatedRequests,
  listCorrelations,
  removeCorrelation,
  clearCorrelations,
  correlationCount,
  extractCorrelationId,
  injectCorrelationHeader,
} from "./webhookCorrelation";

beforeEach(() => {
  clearCorrelations();
});

describe("generateCorrelationId", () => {
  it("should return a string starting with 'corr-'", () => {
    const id = generateCorrelationId();
    expect(id).toMatch(/^corr-/);
  });

  it("should return unique IDs on successive calls", () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateCorrelationId()));
    expect(ids.size).toBe(20);
  });
});

describe("recordCorrelation / getCorrelatedRequests", () => {
  it("should record a request under a correlation ID", () => {
    recordCorrelation("corr-1", "req-a");
    expect(getCorrelatedRequests("corr-1")).toContain("req-a");
  });

  it("should accumulate multiple request IDs", () => {
    recordCorrelation("corr-1", "req-a");
    recordCorrelation("corr-1", "req-b");
    expect(getCorrelatedRequests("corr-1")).toEqual(["req-a", "req-b"]);
  });

  it("should not duplicate a request ID", () => {
    recordCorrelation("corr-1", "req-a");
    recordCorrelation("corr-1", "req-a");
    expect(getCorrelatedRequests("corr-1")).toHaveLength(1);
  });

  it("should return empty array for unknown correlation ID", () => {
    expect(getCorrelatedRequests("unknown")).toEqual([]);
  });
});

describe("listCorrelations", () => {
  it("should list all recorded correlations", () => {
    recordCorrelation("corr-1", "req-a");
    recordCorrelation("corr-2", "req-b");
    const all = listCorrelations();
    expect(Object.keys(all)).toHaveLength(2);
    expect(all["corr-1"]).toContain("req-a");
  });
});

describe("removeCorrelation", () => {
  it("should remove an existing correlation", () => {
    recordCorrelation("corr-1", "req-a");
    expect(removeCorrelation("corr-1")).toBe(true);
    expect(getCorrelatedRequests("corr-1")).toEqual([]);
  });

  it("should return false when removing non-existent correlation", () => {
    expect(removeCorrelation("ghost")).toBe(false);
  });
});

describe("correlationCount", () => {
  it("should reflect current number of tracked correlations", () => {
    expect(correlationCount()).toBe(0);
    recordCorrelation("corr-1", "req-a");
    expect(correlationCount()).toBe(1);
  });
});

describe("extractCorrelationId", () => {
  it("should extract from a string header value", () => {
    expect(extractCorrelationId({ "x-correlation-id": "corr-abc" })).toBe("corr-abc");
  });

  it("should extract first value from array header", () => {
    expect(extractCorrelationId({ "x-correlation-id": ["corr-abc", "corr-xyz"] })).toBe("corr-abc");
  });

  it("should return undefined when header is absent", () => {
    expect(extractCorrelationId({})).toBeUndefined();
  });
});

describe("injectCorrelationHeader", () => {
  it("should add the correlation header to existing headers", () => {
    const result = injectCorrelationHeader({ "content-type": "application/json" }, "corr-xyz");
    expect(result["x-correlation-id"]).toBe("corr-xyz");
    expect(result["content-type"]).toBe("application/json");
  });

  it("should not mutate the original headers object", () => {
    const original = { "content-type": "application/json" };
    injectCorrelationHeader(original, "corr-xyz");
    expect(original).not.toHaveProperty("x-correlation-id");
  });
});
