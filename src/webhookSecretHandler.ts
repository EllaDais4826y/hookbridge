import { IncomingMessage, ServerResponse } from "http";
import {
  addSecret,
  removeSecret,
  listSecrets,
  getSecret,
  clearSecrets,
} from "./webhookSecret.js";

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(payload);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

export async function webhookSecretHandler(
  req: IncomingMessage,
  res: ServerResponse,
  urlPath: string
): Promise<void> {
  const method = req.method ?? "GET";

  if (urlPath === "/admin/secrets" && method === "GET") {
    return json(res, 200, listSecrets());
  }

  if (urlPath === "/admin/secrets" && method === "DELETE") {
    clearSecrets();
    return json(res, 200, { cleared: true });
  }

  if (urlPath === "/admin/secrets" && method === "POST") {
    const raw = await readBody(req);
    let body: { name?: string; secret?: string };
    try {
      body = JSON.parse(raw);
    } catch {
      return json(res, 400, { error: "invalid JSON" });
    }
    if (!body.name || !body.secret) {
      return json(res, 400, { error: "name and secret are required" });
    }
    const entry = addSecret(body.name, body.secret);
    return json(res, 201, entry);
  }

  const deleteMatch = urlPath.match(/^\/admin\/secrets\/([^/]+)$/);
  if (deleteMatch && method === "DELETE") {
    const name = decodeURIComponent(deleteMatch[1]);
    const existed = removeSecret(name);
    return json(res, existed ? 200 : 404, { removed: existed, name });
  }

  const getMatch = urlPath.match(/^\/admin\/secrets\/([^/]+)$/);
  if (getMatch && method === "GET") {
    const name = decodeURIComponent(getMatch[1]);
    const entry = getSecret(name);
    if (!entry) return json(res, 404, { error: "not found" });
    return json(res, 200, entry);
  }

  json(res, 404, { error: "not found" });
}
