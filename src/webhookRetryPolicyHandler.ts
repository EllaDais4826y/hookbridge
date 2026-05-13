import { IncomingMessage, ServerResponse } from "http";
import {
  addRetryPolicy,
  removeRetryPolicy,
  getRetryPolicy,
  listRetryPolicies,
  RetryPolicy,
} from "./webhookRetryPolicy";

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

export async function retryPolicyHandler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const url = req.url ?? "";
  const idMatch = url.match(/\/admin\/retry-policies\/([^/?]+)/);
  const id = idMatch ? decodeURIComponent(idMatch[1]) : null;

  if (req.method === "GET" && !id) {
    return json(res, 200, { policies: listRetryPolicies() });
  }

  if (req.method === "GET" && id) {
    const policy = getRetryPolicy(id);
    if (!policy) return json(res, 404, { error: "not found" });
    return json(res, 200, policy);
  }

  if (req.method === "POST") {
    let body: RetryPolicy;
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      return json(res, 400, { error: "invalid JSON" });
    }
    if (!body.id || !body.strategy || !body.maxAttempts) {
      return json(res, 400, { error: "missing required fields" });
    }
    addRetryPolicy(body);
    return json(res, 201, body);
  }

  if (req.method === "DELETE" && id) {
    const removed = removeRetryPolicy(id);
    if (!removed) return json(res, 404, { error: "not found" });
    return json(res, 200, { deleted: id });
  }

  json(res, 405, { error: "method not allowed" });
}
