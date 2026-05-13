import { IncomingMessage, ServerResponse } from "http";
import {
  addEndpointThrottle,
  removeEndpointThrottle,
  listEndpointThrottles,
  getEndpointThrottle,
  clearEndpointThrottles,
} from "./webhookThrottle";

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(payload);
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

export function isThrottleRoute(req: IncomingMessage): boolean {
  return (req.url ?? "").startsWith("/admin/throttle");
}

export async function tryThrottleRoute(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  if (!isThrottleRoute(req)) return false;

  const url = new URL(req.url ?? "", "http://localhost");
  const endpoint = url.searchParams.get("endpoint") ?? "";

  if (req.method === "GET" && endpoint) {
    const rule = getEndpointThrottle(endpoint);
    if (!rule) return json(res, 404, { error: "not found" }), true;
    return json(res, 200, rule), true;
  }

  if (req.method === "GET") {
    return json(res, 200, listEndpointThrottles()), true;
  }

  if (req.method === "POST") {
    let body: unknown;
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      return json(res, 400, { error: "invalid JSON" }), true;
    }
    const { endpoint: ep, maxPerWindow, windowMs } = body as Record<string, unknown>;
    if (typeof ep !== "string" || typeof maxPerWindow !== "number" || typeof windowMs !== "number") {
      return json(res, 400, { error: "endpoint, maxPerWindow, windowMs required" }), true;
    }
    addEndpointThrottle({ endpoint: ep, maxPerWindow, windowMs });
    return json(res, 201, { ok: true }), true;
  }

  if (req.method === "DELETE" && endpoint) {
    const removed = removeEndpointThrottle(endpoint);
    return json(res, removed ? 200 : 404, { ok: removed }), true;
  }

  if (req.method === "DELETE") {
    clearEndpointThrottles();
    return json(res, 200, { ok: true }), true;
  }

  json(res, 405, { error: "method not allowed" });
  return true;
}
