import { IncomingMessage, ServerResponse } from "http";
import {
  addSnapshot,
  getSnapshot,
  listSnapshots,
  removeSnapshot,
  clearSnapshots,
} from "./webhookSnapshot";

function json(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(body);
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
  });
}

export function isSnapshotRoute(req: IncomingMessage): boolean {
  return (req.url ?? "").startsWith("/admin/snapshots");
}

export async function trySnapshotRoute(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  if (!isSnapshotRoute(req)) return false;

  const url = req.url ?? "";
  const idMatch = url.match(/^\/admin\/snapshots\/([^/]+)$/);
  const id = idMatch?.[1];

  if (req.method === "GET" && !id) {
    return json(res, 200, listSnapshots()), true;
  }

  if (req.method === "GET" && id) {
    const entry = getSnapshot(id);
    if (!entry) return json(res, 404, { error: "not found" }), true;
    return json(res, 200, entry), true;
  }

  if (req.method === "POST" && !id) {
    const raw = await readBody(req);
    let body: any;
    try { body = JSON.parse(raw); } catch { return json(res, 400, { error: "invalid json" }), true; }
    const entry = addSnapshot(body.target, body.payload, body.headers ?? {}, body.label);
    return json(res, 201, entry), true;
  }

  if (req.method === "DELETE" && id) {
    const ok = removeSnapshot(id);
    return json(res, ok ? 200 : 404, { deleted: ok }), true;
  }

  if (req.method === "DELETE" && !id) {
    clearSnapshots();
    return json(res, 200, { cleared: true }), true;
  }

  json(res, 405, { error: "method not allowed" });
  return true;
}
