import type { IncomingMessage, ServerResponse } from "http";
import {
  addFilterRule,
  removeFilterRule,
  listFilterRules,
  getFilterRule,
  WebhookFilterRule,
} from "./webhookFilter";

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(payload);
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export async function webhookFilterHandler(
  req: IncomingMessage,
  res: ServerResponse,
  urlPath: string
): Promise<void> {
  const method = req.method ?? "GET";

  // GET /admin/webhook-filters
  if (method === "GET" && urlPath === "/admin/webhook-filters") {
    return json(res, 200, { rules: listFilterRules() });
  }

  // POST /admin/webhook-filters
  if (method === "POST" && urlPath === "/admin/webhook-filters") {
    const raw = await readBody(req);
    let rule: WebhookFilterRule;
    try {
      rule = JSON.parse(raw);
    } catch {
      return json(res, 400, { error: "Invalid JSON" });
    }
    if (!rule.id || !rule.field || !rule.pattern || !rule.action) {
      return json(res, 400, { error: "Missing required fields: id, field, pattern, action" });
    }
    addFilterRule(rule);
    return json(res, 201, { rule });
  }

  // DELETE /admin/webhook-filters/:id
  const deleteMatch = urlPath.match(/^\/admin\/webhook-filters\/([^/]+)$/);
  if (method === "DELETE" && deleteMatch) {
    const id = decodeURIComponent(deleteMatch[1]);
    const removed = removeFilterRule(id);
    if (!removed) return json(res, 404, { error: "Rule not found" });
    return json(res, 200, { removed: id });
  }

  // GET /admin/webhook-filters/:id
  const getMatch = urlPath.match(/^\/admin\/webhook-filters\/([^/]+)$/);
  if (method === "GET" && getMatch) {
    const id = decodeURIComponent(getMatch[1]);
    const rule = getFilterRule(id);
    if (!rule) return json(res, 404, { error: "Rule not found" });
    return json(res, 200, { rule });
  }

  json(res, 405, { error: "Method not allowed" });
}
