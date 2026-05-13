import type { IncomingMessage, ServerResponse } from "http";
import {
  addReplayEntry,
  getReplayEntry,
  listReplayEntries,
  markReplayed,
  removeReplayEntry,
  clearReplayEntries,
} from "./webhookReplay";

function json(res: ServerResponse, status: number, body: unknown): void {
  const data = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(data);
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

export function isReplayStoreRoute(req: IncomingMessage): boolean {
  return (req.url ?? "").startsWith("/admin/replay-store");
}

export async function tryReplayStoreRoute(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = req.url ?? "";
  const method = req.method ?? "GET";

  if (!url.startsWith("/admin/replay-store")) return false;

  const idMatch = url.match(/^\/admin\/replay-store\/([^/]+)$/);

  // GET /admin/replay-store — list all
  if (method === "GET" && !idMatch) {
    json(res, 200, { entries: listReplayEntries() });
    return true;
  }

  // POST /admin/replay-store — add entry
  if (method === "POST" && !idMatch) {
    try {
      const body = JSON.parse(await readBody(req));
      const entry = addReplayEntry(
        typeof body.payload === "string" ? body.payload : JSON.stringify(body.payload ?? ""),
        body.headers ?? {},
        body.targetUrl
      );
      json(res, 201, entry);
    } catch {
      json(res, 400, { error: "Invalid JSON body" });
    }
    return true;
  }

  // GET /admin/replay-store/:id
  if (method === "GET" && idMatch) {
    const entry = getReplayEntry(idMatch[1]);
    if (!entry) { json(res, 404, { error: "Not found" }); return true; }
    json(res, 200, entry);
    return true;
  }

  // POST /admin/replay-store/:id/mark — mark as replayed
  if (method === "POST" && url.endsWith("/mark")) {
    const id = url.replace("/admin/replay-store/", "").replace("/mark", "");
    const ok = markReplayed(id);
    if (!ok) { json(res, 404, { error: "Not found" }); return true; }
    json(res, 200, getReplayEntry(id));
    return true;
  }

  // DELETE /admin/replay-store/:id
  if (method === "DELETE" && idMatch) {
    const ok = removeReplayEntry(idMatch[1]);
    if (!ok) { json(res, 404, { error: "Not found" }); return true; }
    json(res, 200, { deleted: idMatch[1] });
    return true;
  }

  // DELETE /admin/replay-store — clear all
  if (method === "DELETE" && !idMatch) {
    clearReplayEntries();
    json(res, 200, { cleared: true });
    return true;
  }

  return false;
}
