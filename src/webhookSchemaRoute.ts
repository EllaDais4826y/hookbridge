import { IncomingMessage, ServerResponse } from "http";
import {
  addSchemaRule,
  removeSchemaRule,
  listSchemaRules,
  getSchemaRule,
  SchemaRule,
} from "./webhookSchema";

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
        resolve(JSON.parse(data));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

export function isSchemaRoute(req: IncomingMessage): boolean {
  return (req.url ?? "").startsWith("/admin/schema");
}

export async function trySchemaRoute(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  if (!isSchemaRoute(req)) return false;

  const url = req.url ?? "";
  const method = req.method ?? "GET";
  const idMatch = url.match(/^\/admin\/schema\/([^/]+)$/);

  if (url === "/admin/schema" && method === "GET") {
    json(res, 200, listSchemaRules());
    return true;
  }

  if (url === "/admin/schema" && method === "POST") {
    try {
      const body = (await readBody(req)) as SchemaRule;
      if (!body.id || !body.field || !body.type) {
        json(res, 400, { error: "id, field, and type are required" });
        return true;
      }
      addSchemaRule(body);
      json(res, 201, getSchemaRule(body.id));
    } catch {
      json(res, 400, { error: "Invalid JSON body" });
    }
    return true;
  }

  if (idMatch && method === "DELETE") {
    const id = idMatch[1];
    const removed = removeSchemaRule(id);
    if (removed) {
      json(res, 200, { removed: id });
    } else {
      json(res, 404, { error: "Rule not found" });
    }
    return true;
  }

  if (idMatch && method === "GET") {
    const rule = getSchemaRule(idMatch[1]);
    if (rule) {
      json(res, 200, rule);
    } else {
      json(res, 404, { error: "Rule not found" });
    }
    return true;
  }

  json(res, 405, { error: "Method not allowed" });
  return true;
}
