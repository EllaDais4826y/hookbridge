import type { IncomingMessage, ServerResponse } from "http";
import {
  muteTarget,
  unmuteTarget,
  isMuted,
  getMuteEntry,
  listMuted,
  clearMutes,
} from "./webhookMute";

function json(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(body);
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

export async function webhookMuteHandler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const parts = url.pathname.replace(/^\/admin\/mute\/?/, "").split("/").filter(Boolean);
  const target = parts[0] ? decodeURIComponent(parts[0]) : null;

  if (req.method === "GET" && !target) {
    return json(res, 200, { muted: listMuted() });
  }

  if (req.method === "GET" && target) {
    const entry = getMuteEntry(target);
    if (!entry) return json(res, 404, { error: "Not found" });
    return json(res, 200, entry);
  }

  if (req.method === "POST" && target) {
    const body = (await readBody(req)) as { reason?: string };
    const entry = muteTarget(target, body?.reason);
    return json(res, 201, entry);
  }

  if (req.method === "DELETE" && target === "_all") {
    clearMutes();
    return json(res, 200, { cleared: true });
  }

  if (req.method === "DELETE" && target) {
    const removed = unmuteTarget(target);
    if (!removed) return json(res, 404, { error: "Not found" });
    return json(res, 200, { unmuted: target });
  }

  json(res, 405, { error: "Method not allowed" });
}
