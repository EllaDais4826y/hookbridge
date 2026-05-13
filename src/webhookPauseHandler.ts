import type { IncomingMessage, ServerResponse } from "http";
import {
  pauseTarget,
  resumeTarget,
  listPaused,
  getPauseEntry,
  clearPaused,
} from "./webhookPause";

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(payload);
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

export async function webhookPauseHandler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const method = req.method ?? "GET";
  const url = new URL(req.url ?? "/", "http://localhost");
  const target = url.searchParams.get("target");

  if (method === "GET") {
    if (target) {
      const entry = getPauseEntry(target);
      if (!entry) return json(res, 404, { error: "Not found" });
      return json(res, 200, entry);
    }
    return json(res, 200, listPaused());
  }

  if (method === "POST") {
    try {
      const body = (await readBody(req)) as { target?: string; reason?: string };
      if (!body.target) return json(res, 400, { error: "target is required" });
      const entry = pauseTarget(body.target, body.reason);
      return json(res, 201, entry);
    } catch {
      return json(res, 400, { error: "Invalid JSON" });
    }
  }

  if (method === "DELETE") {
    if (target) {
      const removed = resumeTarget(target);
      return json(res, removed ? 200 : 404, { removed });
    }
    clearPaused();
    return json(res, 200, { cleared: true });
  }

  json(res, 405, { error: "Method not allowed" });
}
