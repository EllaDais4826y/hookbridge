// Webhook namespace management: group endpoints under logical namespaces

export interface NamespaceEntry {
  id: string;
  name: string;
  prefix: string;
  endpoints: string[];
  createdAt: string;
}

const namespaces = new Map<string, NamespaceEntry>();

export function generateNamespaceId(): string {
  return `ns_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function addNamespace(name: string, prefix: string, endpoints: string[]): NamespaceEntry {
  const id = generateNamespaceId();
  const entry: NamespaceEntry = {
    id,
    name,
    prefix: prefix.startsWith('/') ? prefix : `/${prefix}`,
    endpoints: [...endpoints],
    createdAt: new Date().toISOString(),
  };
  namespaces.set(id, entry);
  return entry;
}

export function removeNamespace(id: string): boolean {
  return namespaces.delete(id);
}

export function getNamespace(id: string): NamespaceEntry | undefined {
  return namespaces.get(id);
}

export function listNamespaces(): NamespaceEntry[] {
  return Array.from(namespaces.values());
}

export function clearNamespaces(): void {
  namespaces.clear();
}

export function resolveNamespace(path: string): NamespaceEntry | undefined {
  for (const entry of namespaces.values()) {
    if (path.startsWith(entry.prefix)) {
      return entry;
    }
  }
  return undefined;
}

export function updateNamespaceEndpoints(id: string, endpoints: string[]): NamespaceEntry | undefined {
  const entry = namespaces.get(id);
  if (!entry) return undefined;
  const updated = { ...entry, endpoints: [...endpoints] };
  namespaces.set(id, updated);
  return updated;
}
