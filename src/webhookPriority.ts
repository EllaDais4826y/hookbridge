/**
 * Webhook priority queue — assign priority levels to incoming events
 * so higher-priority webhooks are fanned out before lower-priority ones.
 */

export type PriorityLevel = 'critical' | 'high' | 'normal' | 'low';

const PRIORITY_ORDER: Record<PriorityLevel, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

export interface PriorityRule {
  id: string;
  headerName: string;
  headerValue: string;
  priority: PriorityLevel;
}

const rules: Map<string, PriorityRule> = new Map();

let defaultPriority: PriorityLevel = 'normal';

export function setDefaultPriority(level: PriorityLevel): void {
  defaultPriority = level;
}

export function getDefaultPriority(): PriorityLevel {
  return defaultPriority;
}

export function addPriorityRule(rule: PriorityRule): void {
  rules.set(rule.id, rule);
}

export function removePriorityRule(id: string): boolean {
  return rules.delete(id);
}

export function listPriorityRules(): PriorityRule[] {
  return Array.from(rules.values());
}

export function clearPriorityRules(): void {
  rules.clear();
  defaultPriority = 'normal';
}

export function getPriorityRule(id: string): PriorityRule | undefined {
  return rules.get(id);
}

/**
 * Resolve the priority level for a given set of request headers.
 * The first matching rule wins; falls back to the default priority.
 */
export function resolvePriority(
  headers: Record<string, string | string[] | undefined>
): PriorityLevel {
  for (const rule of rules.values()) {
    const headerVal = headers[rule.headerName.toLowerCase()];
    const value = Array.isArray(headerVal) ? headerVal[0] : headerVal;
    if (value && value.toLowerCase() === rule.headerValue.toLowerCase()) {
      return rule.priority;
    }
  }
  return defaultPriority;
}

/**
 * Sort an array of items by their resolved priority (ascending — critical first).
 */
export function sortByPriority<T>(
  items: T[],
  getPriorityFn: (item: T) => PriorityLevel
): T[] {
  return [...items].sort(
    (a, b) => PRIORITY_ORDER[getPriorityFn(a)] - PRIORITY_ORDER[getPriorityFn(b)]
  );
}
