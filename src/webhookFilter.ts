/**
 * webhookFilter.ts
 * Allows filtering incoming webhook events by source path pattern or header value.
 */

export interface WebhookFilterRule {
  id: string;
  field: "path" | "header";
  headerName?: string;
  pattern: string; // regex pattern
  action: "allow" | "deny";
}

const rules: Map<string, WebhookFilterRule> = new Map();

export function addFilterRule(rule: WebhookFilterRule): void {
  rules.set(rule.id, rule);
}

export function removeFilterRule(id: string): boolean {
  return rules.delete(id);
}

export function listFilterRules(): WebhookFilterRule[] {
  return Array.from(rules.values());
}

export function clearFilterRules(): void {
  rules.clear();
}

export function getFilterRule(id: string): WebhookFilterRule | undefined {
  return rules.get(id);
}

export function evaluateFilters(
  path: string,
  headers: Record<string, string | string[] | undefined>
): "allow" | "deny" | "pass" {
  for (const rule of rules.values()) {
    const regex = new RegExp(rule.pattern);
    if (rule.field === "path") {
      if (regex.test(path)) return rule.action;
    } else if (rule.field === "header" && rule.headerName) {
      const val = headers[rule.headerName.toLowerCase()];
      const strVal = Array.isArray(val) ? val.join(",") : val ?? "";
      if (regex.test(strVal)) return rule.action;
    }
  }
  return "pass";
}
