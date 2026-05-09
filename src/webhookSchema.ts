import { IncomingMessage } from "http";

export interface SchemaRule {
  id: string;
  field: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  required: boolean;
  pattern?: string;
}

const rules: Map<string, SchemaRule> = new Map();

export function addSchemaRule(rule: SchemaRule): void {
  rules.set(rule.id, { ...rule });
}

export function removeSchemaRule(id: string): boolean {
  return rules.delete(id);
}

export function listSchemaRules(): SchemaRule[] {
  return Array.from(rules.values());
}

export function getSchemaRule(id: string): SchemaRule | undefined {
  return rules.get(id);
}

export function clearSchemaRules(): void {
  rules.clear();
}

export function validatePayload(
  payload: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const rule of rules.values()) {
    const value = payload[rule.field];

    if (rule.required && (value === undefined || value === null)) {
      errors.push(`Field "${rule.field}" is required`);
      continue;
    }

    if (value === undefined || value === null) continue;

    const actualType = Array.isArray(value) ? "array" : typeof value;
    if (actualType !== rule.type) {
      errors.push(
        `Field "${rule.field}" expected type ${rule.type}, got ${actualType}`
      );
    }

    if (rule.pattern && typeof value === "string") {
      const regex = new RegExp(rule.pattern);
      if (!regex.test(value)) {
        errors.push(
          `Field "${rule.field}" does not match pattern ${rule.pattern}`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
