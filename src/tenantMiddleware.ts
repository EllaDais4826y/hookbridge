import type { IncomingMessage, ServerResponse } from "http";
import { extractTenantId, resolveEndpoints } from "./tenantRouter";

export interface TenantMiddlewareOptions {
  /** Header used to identify the tenant. Defaults to 'x-tenant-id'. */
  headerName?: string;
  /** Fallback endpoints when no tenant match is found. */
  fallbackEndpoints: string[];
}

/**
 * Attaches resolved endpoints to the request object so downstream
 * handlers (fanout) can pick them up without re-resolving.
 */
export function createTenantMiddleware(
  options: TenantMiddlewareOptions
): (
  req: IncomingMessage & { resolvedEndpoints?: string[] },
  res: ServerResponse,
  next: () => void
) => void {
  const headerName = options.headerName ?? "x-tenant-id";

  return function tenantMiddleware(
    req: IncomingMessage & { resolvedEndpoints?: string[] },
    _res: ServerResponse,
    next: () => void
  ): void {
    const tenantId = extractTenantId(
      req.headers as Record<string, string | string[] | undefined>,
      headerName
    );

    req.resolvedEndpoints = resolveEndpoints(
      tenantId ?? "",
      options.fallbackEndpoints
    );

    next();
  };
}

/**
 * Returns a snapshot of the resolved endpoints attached to a request.
 * Useful for logging or diagnostics without mutating the request object.
 *
 * @param req - The incoming request, potentially enriched by tenant middleware.
 * @returns The resolved endpoints array, or an empty array if none are attached.
 */
export function getResolvedEndpoints(
  req: IncomingMessage & { resolvedEndpoints?: string[] }
): string[] {
  return req.resolvedEndpoints ?? [];
}
