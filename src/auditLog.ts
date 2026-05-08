export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  detail?: string;
  ip?: string;
}

let entries: AuditEntry[] = [];
let maxEntries = 500;

export function configureAuditLog(opts: { maxEntries?: number }): void {
  if (opts.maxEntries !== undefined) maxEntries = opts.maxEntries;
}

export function generateAuditId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function recordAudit(
  actor: string,
  action: string,
  resource: string,
  detail?: string,
  ip?: string
): AuditEntry {
  const entry: AuditEntry = {
    id: generateAuditId(),
    timestamp: new Date().toISOString(),
    actor,
    action,
    resource,
    detail,
    ip,
  };
  entries.unshift(entry);
  if (entries.length > maxEntries) entries = entries.slice(0, maxEntries);
  return entry;
}

export function listAuditLog(limit = 100): AuditEntry[] {
  return entries.slice(0, limit);
}

export function getAuditEntry(id: string): AuditEntry | undefined {
  return entries.find((e) => e.id === id);
}

export function clearAuditLog(): void {
  entries = [];
}

export function auditLogSize(): number {
  return entries.length;
}
