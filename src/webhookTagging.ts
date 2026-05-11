// Webhook tagging: assign tags to incoming webhooks for routing and filtering

export interface TagRule {
  id: string;
  headerKey: string;
  headerValue: string;
  tags: string[];
}

const tagRules: Map<string, TagRule> = new Map();

export function addTagRule(rule: TagRule): void {
  tagRules.set(rule.id, rule);
}

export function removeTagRule(id: string): boolean {
  return tagRules.delete(id);
}

export function getTagRule(id: string): TagRule | undefined {
  return tagRules.get(id);
}

export function listTagRules(): TagRule[] {
  return Array.from(tagRules.values());
}

export function clearTagRules(): void {
  tagRules.clear();
}

export function resolveTagsForHeaders(
  headers: Record<string, string | string[] | undefined>
): string[] {
  const matched = new Set<string>();
  for (const rule of tagRules.values()) {
    const headerVal = headers[rule.headerKey.toLowerCase()];
    const value = Array.isArray(headerVal) ? headerVal[0] : headerVal;
    if (value !== undefined && value === rule.headerValue) {
      for (const tag of rule.tags) {
        matched.add(tag);
      }
    }
  }
  return Array.from(matched);
}

export function tagsMatchFilter(
  tags: string[],
  required: string[]
): boolean {
  if (required.length === 0) return true;
  const tagSet = new Set(tags);
  return required.every((t) => tagSet.has(t));
}
