import {
  addFilterRule,
  removeFilterRule,
  listFilterRules,
  clearFilterRules,
  getFilterRule,
  evaluateFilters,
} from "./webhookFilter";

beforeEach(() => clearFilterRules());

test("addFilterRule and listFilterRules", () => {
  addFilterRule({ id: "r1", field: "path", pattern: "/webhooks/.*", action: "allow" });
  expect(listFilterRules()).toHaveLength(1);
  expect(listFilterRules()[0].id).toBe("r1");
});

test("getFilterRule returns correct rule", () => {
  addFilterRule({ id: "r2", field: "path", pattern: "/deny/.*", action: "deny" });
  const rule = getFilterRule("r2");
  expect(rule).toBeDefined();
  expect(rule?.action).toBe("deny");
});

test("removeFilterRule removes the rule", () => {
  addFilterRule({ id: "r3", field: "path", pattern: "/test", action: "allow" });
  const removed = removeFilterRule("r3");
  expect(removed).toBe(true);
  expect(listFilterRules()).toHaveLength(0);
});

test("removeFilterRule returns false for missing id", () => {
  expect(removeFilterRule("nonexistent")).toBe(false);
});

test("evaluateFilters returns allow for matching path rule", () => {
  addFilterRule({ id: "r4", field: "path", pattern: "^/hooks", action: "allow" });
  expect(evaluateFilters("/hooks/github", {})).toBe("allow");
});

test("evaluateFilters returns deny for matching deny rule", () => {
  addFilterRule({ id: "r5", field: "path", pattern: "^/blocked", action: "deny" });
  expect(evaluateFilters("/blocked/path", {})).toBe("deny");
});

test("evaluateFilters returns pass when no rules match", () => {
  addFilterRule({ id: "r6", field: "path", pattern: "^/specific", action: "deny" });
  expect(evaluateFilters("/other/path", {})).toBe("pass");
});

test("evaluateFilters matches header rule", () => {
  addFilterRule({
    id: "r7",
    field: "header",
    headerName: "x-source",
    pattern: "github",
    action: "allow",
  });
  expect(evaluateFilters("/any", { "x-source": "github-webhook" })).toBe("allow");
});

test("evaluateFilters ignores header rule when header absent", () => {
  addFilterRule({
    id: "r8",
    field: "header",
    headerName: "x-source",
    pattern: "github",
    action: "deny",
  });
  expect(evaluateFilters("/any", {})).toBe("pass");
});

test("clearFilterRules empties all rules", () => {
  addFilterRule({ id: "r9", field: "path", pattern: ".*", action: "allow" });
  clearFilterRules();
  expect(listFilterRules()).toHaveLength(0);
});
