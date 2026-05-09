import { IncomingMessage, ServerResponse } from "http";
import { flush, pendingCount, configureBatch, getBatchOptions } from "./webhookBatch";

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(payload);
}

export function isBatchRoute(req: IncomingMessage): boolean {
  const url = req.url ?? "";
  return url.startsWith("/_hookbridge/batch");
}

export function tryBatchRoute(
  req: IncomingMessage,
  res: ServerResponse
): boolean {
  const url = req.url ?? "";
  const method = req.method ?? "GET";

  if (url === "/_hookbridge/batch/flush" && method === "POST") {
    const batch = flush();
    if (!batch) {
      json(res, 200, { flushed: false, message: "No pending events" });
    } else {
      json(res, 200, { flushed: true, batch });
    }
    return true;
  }

  if (url === "/_hookbridge/batch/status" && method === "GET") {
    json(res, 200, {
      pending: pendingCount(),
      options: getBatchOptions(),
    });
    return true;
  }

  if (url === "/_hookbridge/batch/config" && method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const opts = JSON.parse(body);
        configureBatch(opts);
        json(res, 200, { updated: true, options: getBatchOptions() });
      } catch {
        json(res, 400, { error: "Invalid JSON" });
      }
    });
    return true;
  }

  return false;
}
