import { IncomingMessage, ServerResponse } from "http";
import {
  getCorrelatedRequests,
  listCorrelations,
  removeCorrelation,
  clearCorrelations,
} from "./webhookCorrelation";

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(payload);
}

export function isCorrelationRoute(req: IncomingMessage): boolean {
  return (req.url ?? "").startsWith("/admin/correlations");
}

export function tryCorrelationRoute(
  req: IncomingMessage,
  res: ServerResponse
): boolean {
  const url = req.url ?? "";
  const method = req.method ?? "GET";

  // GET /admin/correlations — list all correlation IDs
  if (url === "/admin/correlations" && method === "GET") {
    const entries = listCorrelations();
    json(res, 200, { correlations: entries });
    return true;
  }

  // DELETE /admin/correlations — clear all correlations
  if (url === "/admin/correlations" && method === "DELETE") {
    clearCorrelations();
    json(res, 200, { ok: true });
    return true;
  }

  // GET /admin/correlations/:id — get correlated requests for an ID
  const matchGet = url.match(/^\/admin\/correlations\/([^/]+)$/);
  if (matchGet && method === "GET") {
    const id = decodeURIComponent(matchGet[1]);
    const requests = getCorrelatedRequests(id);
    if (requests.length === 0) {
      json(res, 404, { error: "Correlation ID not found" });
    } else {
      json(res, 200, { correlationId: id, requests });
    }
    return true;
  }

  // DELETE /admin/correlations/:id — remove a specific correlation
  const matchDelete = url.match(/^\/admin\/correlations\/([^/]+)$/);
  if (matchDelete && method === "DELETE") {
    const id = decodeURIComponent(matchDelete[1]);
    removeCorrelation(id);
    json(res, 200, { ok: true });
    return true;
  }

  return false;
}
