/**
 * webhookAlias.ts
 * Allows incoming requests to be matched by a short alias and routed
 * to a canonical endpoint path, enabling stable external URLs.
 */

export interface AliasEntry {
  alias: string;
  target: string;
  description?: string;
  createdAt: string;
}

const aliasMap = new Map<string, AliasEntry>();

export function addAlias(alias: string, target: string, description?: string): AliasEntry {
  const entry: AliasEntry = {
    alias,
    target,
    description,
    createdAt: new Date().toISOString(),
  };
  aliasMap.set(alias, entry);
  return entry;
}

export function removeAlias(alias: string): boolean {
  return aliasMap.delete(alias);
}

export function getAlias(alias: string): AliasEntry | undefined {
  return aliasMap.get(alias);
}

export function listAliases(): AliasEntry[] {
  return Array.from(aliasMap.values());
}

export function clearAliases(): void {
  aliasMap.clear();
}

export function resolveAlias(alias: string): string | undefined {
  return aliasMap.get(alias)?.target;
}
