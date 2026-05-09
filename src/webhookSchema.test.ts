import {
  addSchemaRule,
  removeSchemaRule,
  listSchemaRules,
  getSchemaRule,
  clearSchemaRules,
  validatePayload,
  SchemaRule,
} from "./webhookSchema";

beforeEach(() => {
  clearSchemaRules();
});

const baseRule: SchemaRule = {
  id: "r1",
  field: "event",
  type: "string",
  required: true,
};

describe("schema rule management", () => {
  test("addSchemaRule stores rule", () => {
    addSchemaRule(baseRule);
    expect(getSchemaRule("r1")).toEqual(baseRule);
  });

  test("listSchemaRules returns all rules", () => {
    addSchemaRule(baseRule);
    addSchemaRule({ id: "r2", field: "count", type: "number", required: false });
    expect(listSchemaRules()).toHaveLength(2);
  });

  test("removeSchemaRule deletes rule", () => {
    addSchemaRule(baseRule);
    expect(removeSchemaRule("r1")).toBe(true);
    expect(getSchemaRule("r1")).toBeUndefined();
  });

  test("removeSchemaRule returns false for unknown id", () => {
    expect(removeSchemaRule("nope")).toBe(false);
  });

  test("clearSchemaRules empties all rules", () => {
    addSchemaRule(baseRule);
    clearSchemaRules();
    expect(listSchemaRules()).toHaveLength(0);
  });
});

describe("validatePayload", () => {
  test("valid payload passes", () => {
    addSchemaRule(baseRule);
    const result = validatePayload({ event: "push" });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("missing required field fails", () => {
    addSchemaRule(baseRule);
    const result = validatePayload({});
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/required/);
  });

  test("wrong type fails", () => {
    addSchemaRule(baseRule);
    const result = validatePayload({ event: 42 });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/expected type string/);
  });

  test("pattern mismatch fails", () => {
    addSchemaRule({ ...baseRule, pattern: "^[a-z]+$" });
    const result = validatePayload({ event: "PUSH123" });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/pattern/);
  });

  test("optional missing field passes", () => {
    addSchemaRule({ id: "r2", field: "meta", type: "object", required: false });
    const result = validatePayload({});
    expect(result.valid).toBe(true);
  });

  test("array type check works", () => {
    addSchemaRule({ id: "r3", field: "tags", type: "array", required: true });
    expect(validatePayload({ tags: ["a"] }).valid).toBe(true);
    expect(validatePayload({ tags: "a" }).valid).toBe(false);
  });
});
