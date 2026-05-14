// Webhook endpoint grouping — organize endpoints into named groups

export interface WebhookGroup {
  id: string;
  name: string;
  description?: string;
  endpoints: string[];
  createdAt: string;
}

const groups = new Map<string, WebhookGroup>();

export function generateGroupId(): string {
  return `grp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function addGroup(name: string, endpoints: string[], description?: string): WebhookGroup {
  const id = generateGroupId();
  const group: WebhookGroup = { id, name, description, endpoints, createdAt: new Date().toISOString() };
  groups.set(id, group);
  return group;
}

export function removeGroup(id: string): boolean {
  return groups.delete(id);
}

export function getGroup(id: string): WebhookGroup | undefined {
  return groups.get(id);
}

export function listGroups(): WebhookGroup[] {
  return Array.from(groups.values());
}

export function clearGroups(): void {
  groups.clear();
}

export function updateGroup(id: string, patch: Partial<Pick<WebhookGroup, 'name' | 'description' | 'endpoints'>>): WebhookGroup | undefined {
  const group = groups.get(id);
  if (!group) return undefined;
  const updated = { ...group, ...patch };
  groups.set(id, updated);
  return updated;
}

export function getGroupCount(): number {
  return groups.size;
}
