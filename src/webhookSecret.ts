/**
 * Webhook secret rotation: store named secrets, validate against any active secret.
 */

export interface SecretEntry {
  name: string;
  secret: string;
  createdAt: number;
}

const secrets: Map<string, SecretEntry> = new Map();

export function addSecret(name: string, secret: string): SecretEntry {
  const entry: SecretEntry = { name, secret, createdAt: Date.now() };
  secrets.set(name, entry);
  return entry;
}

export function removeSecret(name: string): boolean {
  return secrets.delete(name);
}

export function listSecrets(): SecretEntry[] {
  return Array.from(secrets.values()).sort((a, b) => a.createdAt - b.createdAt);
}

export function getSecret(name: string): SecretEntry | undefined {
  return secrets.get(name);
}

export function clearSecrets(): void {
  secrets.clear();
}

export function findMatchingSecret(secret: string): SecretEntry | undefined {
  for (const entry of secrets.values()) {
    if (entry.secret === secret) return entry;
  }
  return undefined;
}

export function secretCount(): number {
  return secrets.size;
}
