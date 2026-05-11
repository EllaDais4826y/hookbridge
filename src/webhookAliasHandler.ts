import type { IncomingMessage, ServerResponse } from "http";
import {
  addAlias,
  removeAlias,
  listAliases,
  getAlias,
  AliasEntry,
} from "./webhookAlias";

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(payload);
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export async function webhookAliasHandler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const method = req.method ?? "GET";

  if (method === "GET") {
    return json(res, 200, listAliases());
  }

  if (method === "POST") {
    let body: { alias?: string; target?: string; description?: string };
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      return json(res, 400, { error: "Invalid JSON" });
    }
    if (!body.alias || !body.target) {
      return json(res, 400, { error: "alias and target are required" });
    }
    const entry: AliasEntry = addAlias(body.alias, body.target, body.description);
    return json(res, 201, entry);
  }

  if (method === "DELETE") {
    let body: { alias?: string };
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      return json(res, 400, { error: "Invalid JSON" });
    }
    if (!body.alias) {
      return json(res, 400, { error: "alias is required" });
    }
    const existed = removeAlias(body.alias);
    return json(res, existed ? 200 : 404, { removed: existed });
  }

  json(res, 405, { error: "Method not allowed" });
}
