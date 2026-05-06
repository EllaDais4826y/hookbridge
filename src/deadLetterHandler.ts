import { IncomingMessage, ServerResponse } from "http";
import {
  listDeadLetters,
  getDeadLetter,
  removeDeadLetter,
  clearDeadLetters,
} from "./deadLetter";

function jsonResponse(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(payload);
}

export function deadLetterHandler(req: IncomingMessage, res: ServerResponse): void {
  const url = req.url ?? "";
  const method = req.method ?? "GET";

  // DELETE /admin/dead-letters  — clear all
  if (method === "DELETE" && /^\/admin\/dead-letters\/?$/.test(url)) {
    clearDeadLetters();
    return jsonResponse(res, 200, { cleared: true });
  }

  // DELETE /admin/dead-letters/:id
  const deleteMatch = url.match(/^\/admin\/dead-letters\/([^/]+)$/);
  if (method === "DELETE" && deleteMatch) {
    const removed = removeDeadLetter(deleteMatch[1]);
    if (!removed) return jsonResponse(res, 404, { error: "not found" });
    return jsonResponse(res, 200, { removed: true });
  }

  // GET /admin/dead-letters/:id
  const getMatch = url.match(/^\/admin\/dead-letters\/([^/]+)$/);
  if (method === "GET" && getMatch) {
    const entry = getDeadLetter(getMatch[1]);
    if (!entry) return jsonResponse(res, 404, { error: "not found" });
    return jsonResponse(res, 200, entry);
  }

  // GET /admin/dead-letters
  if (method === "GET" && /^\/admin\/dead-letters\/?$/.test(url)) {
    return jsonResponse(res, 200, listDeadLetters());
  }

  jsonResponse(res, 405, { error: "method not allowed" });
}
