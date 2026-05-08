import type { IncomingMessage, ServerResponse } from "http";
import {
  addTenant,
  removeTenant,
  getTenant,
  listTenants,
  TenantConfig,
} from "./tenantRouter";

const PREFIX = "/admin/tenants";

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(payload);
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw || "null"));
      } catch {
        reject(new Error("invalid json"));
      }
    });
    req.on("error", reject);
  });
}

export function isTenantRoute(req: IncomingMessage): boolean {
  return (req.url ?? "").startsWith(PREFIX);
}

export async function tryTenantRoute(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  if (!isTenantRoute(req)) return false;

  const url = req.url ?? "";
  const method = req.method ?? "GET";
  const idMatch = url.match(new RegExp(`^${PREFIX}/([^/?]+)`));
  const tenantId = idMatch ? decodeURIComponent(idMatch[1]) : null;

  if (method === "GET" && !tenantId) {
    json(res, 200, listTenants());
    return true;
  }

  if (method === "GET" && tenantId) {
    const t = getTenant(tenantId);
    if (!t) { json(res, 404, { error: "not found" }); return true; }
    json(res, 200, t);
    return true;
  }

  if (method === "POST" && !tenantId) {
    try {
      const body = (await readBody(req)) as TenantConfig;
      if (!body?.tenantId || !Array.isArray(body.endpoints)) {
        json(res, 400, { error: "tenantId and endpoints required" });
        return true;
      }
      addTenant(body);
      json(res, 201, getTenant(body.tenantId));
    } catch {
      json(res, 400, { error: "invalid json" });
    }
    return true;
  }

  if (method === "DELETE" && tenantId) {
    const removed = removeTenant(tenantId);
    json(res, removed ? 200 : 404, { removed });
    return true;
  }

  json(res, 405, { error: "method not allowed" });
  return true;
}
