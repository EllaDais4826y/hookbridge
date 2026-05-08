import type { IncomingMessage, ServerResponse } from "http";
import {
  clearEndpointHealth,
  getEndpointHealth,
  listEndpointHealth,
  resetEndpointHealth,
} from "./endpointHealth";

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(payload);
}

export function isEndpointHealthRoute(req: IncomingMessage): boolean {
  return (req.url ?? "").startsWith("/admin/endpoint-health");
}

export function tryEndpointHealthRoute(
  req: IncomingMessage,
  res: ServerResponse
): boolean {
  const url = req.url ?? "";
  const method = req.method ?? "GET";

  // GET /admin/endpoint-health — list all
  if (url === "/admin/endpoint-health" && method === "GET") {
    json(res, 200, listEndpointHealth());
    return true;
  }

  // GET /admin/endpoint-health/:encoded — single entry
  const singleMatch = url.match(/^\/admin\/endpoint-health\/(.+)$/);
  if (singleMatch && method === "GET") {
    const target = decodeURIComponent(singleMatch[1]);
    const entry = getEndpointHealth(target);
    if (!entry) {
      json(res, 404, { error: "not found" });
    } else {
      json(res, 200, entry);
    }
    return true;
  }

  // DELETE /admin/endpoint-health/:encoded — reset single
  if (singleMatch && method === "DELETE") {
    const target = decodeURIComponent(singleMatch[1]);
    resetEndpointHealth(target);
    json(res, 200, { ok: true });
    return true;
  }

  // DELETE /admin/endpoint-health — clear all
  if (url === "/admin/endpoint-health" && method === "DELETE") {
    clearEndpointHealth();
    json(res, 200, { ok: true });
    return true;
  }

  return false;
}
