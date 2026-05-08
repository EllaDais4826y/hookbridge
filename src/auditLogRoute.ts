import type { IncomingMessage, ServerResponse } from "http";
import { listAuditLog, getAuditEntry, clearAuditLog } from "./auditLog";

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(payload);
}

export function isAuditLogRoute(req: IncomingMessage): boolean {
  return (req.url ?? "").startsWith("/admin/audit");
}

export function tryAuditLogRoute(
  req: IncomingMessage,
  res: ServerResponse
): boolean {
  const url = req.url ?? "";
  const method = req.method ?? "GET";

  // GET /admin/audit — list entries
  if (method === "GET" && url === "/admin/audit") {
    const limitParam = new URL(url, "http://localhost").searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 100;
    json(res, 200, { entries: listAuditLog(isNaN(limit) ? 100 : limit) });
    return true;
  }

  // GET /admin/audit/:id — single entry
  const singleMatch = url.match(/^\/admin\/audit\/([^/]+)$/);
  if (method === "GET" && singleMatch) {
    const entry = getAuditEntry(singleMatch[1]);
    if (!entry) {
      json(res, 404, { error: "not found" });
    } else {
      json(res, 200, entry);
    }
    return true;
  }

  // DELETE /admin/audit — clear all
  if (method === "DELETE" && url === "/admin/audit") {
    clearAuditLog();
    json(res, 200, { ok: true });
    return true;
  }

  return false;
}
