import { IncomingMessage, ServerResponse } from "http";
import { listRequestLogs, clearRequestLogs } from "./requestLog";

function jsonResponse(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

export function requestLogHandler(
  req: IncomingMessage,
  res: ServerResponse
): void {
  const url = new URL(req.url ?? "/", "http://localhost");

  if (req.method === "DELETE") {
    clearRequestLogs();
    jsonResponse(res, 200, { ok: true, message: "Request log cleared" });
    return;
  }

  if (req.method !== "GET") {
    jsonResponse(res, 405, { error: "Method not allowed" });
    return;
  }

  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 50;

  if (isNaN(limit) || limit < 1) {
    jsonResponse(res, 400, { error: "Invalid limit parameter" });
    return;
  }

  const entries = listRequestLogs(limit);
  jsonResponse(res, 200, { count: entries.length, entries });
}
