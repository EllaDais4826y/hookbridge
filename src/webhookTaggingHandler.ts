import type { IncomingMessage, ServerResponse } from "http";
import {
  addTagRule,
  removeTagRule,
  listTagRules,
  getTagRule,
  TagRule,
} from "./webhookTagging";

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

export async function webhookTaggingHandler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const method = req.method ?? "GET";
  const url = new URL(req.url ?? "/", "http://localhost");
  const parts = url.pathname.replace(/^\/admin\/tags/, "").split("/").filter(Boolean);
  const ruleId = parts[0];

  if (method === "GET" && !ruleId) {
    return json(res, 200, { rules: listTagRules() });
  }

  if (method === "GET" && ruleId) {
    const rule = getTagRule(ruleId);
    if (!rule) return json(res, 404, { error: "Not found" });
    return json(res, 200, rule);
  }

  if (method === "POST") {
    let body: unknown;
    try {
      body = await readBody(req);
    } catch {
      return json(res, 400, { error: "Invalid JSON" });
    }
    const { id, headerKey, headerValue, tags } = body as Partial<TagRule>;
    if (!id || !headerKey || !headerValue || !Array.isArray(tags)) {
      return json(res, 400, { error: "Missing required fields: id, headerKey, headerValue, tags" });
    }
    addTagRule({ id, headerKey, headerValue, tags });
    return json(res, 201, { ok: true, id });
  }

  if (method === "DELETE" && ruleId) {
    const removed = removeTagRule(ruleId);
    if (!removed) return json(res, 404, { error: "Not found" });
    return json(res, 200, { ok: true });
  }

  return json(res, 405, { error: "Method not allowed" });
}
