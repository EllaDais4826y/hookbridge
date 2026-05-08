/**
 * Tenant-based routing: map incoming webhook sources to different
 * sets of downstream endpoints based on a tenant identifier.
 */

export interface TenantConfig {
  tenantId: string;
  endpoints: string[];
}

const tenants = new Map<string, TenantConfig>();

export function addTenant(config: TenantConfig): void {
  tenants.set(config.tenantId, { ...config });
}

export function removeTenant(tenantId: string): boolean {
  return tenants.delete(tenantId);
}

export function getTenant(tenantId: string): TenantConfig | undefined {
  const t = tenants.get(tenantId);
  return t ? { ...t } : undefined;
}

export function listTenants(): TenantConfig[] {
  return Array.from(tenants.values()).map((t) => ({ ...t }));
}

export function clearTenants(): void {
  tenants.clear();
}

export function resolveEndpoints(
  tenantId: string,
  fallback: string[]
): string[] {
  const t = tenants.get(tenantId);
  return t ? [...t.endpoints] : [...fallback];
}

export function extractTenantId(
  headers: Record<string, string | string[] | undefined>,
  headerName = "x-tenant-id"
): string | undefined {
  const val = headers[headerName.toLowerCase()];
  if (Array.isArray(val)) return val[0];
  return val;
}
