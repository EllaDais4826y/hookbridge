import { IncomingMessage, ServerResponse } from "http";
import { addToBatch, BatchEntry } from "./webhookBatch";
import { generateRequestId } from "./requestLog";

type Next = () => void;
type Middleware = (req: IncomingMessage, res: ServerResponse, next: Next) => void;

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

export function createBatchMiddleware(): Middleware {
  return async function batchMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: Next
  ): Promise<void> {
    const batchMode = req.headers["x-hookbridge-batch"];
    if (!batchMode || batchMode !== "true") {
      return next();
    }

    let rawBody = "";
    try {
      rawBody = await readBody(req);
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to read request body" }));
      return;
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = rawBody;
    }

    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (typeof v === "string") headers[k] = v;
    }

    const entry: BatchEntry = {
      id: generateRequestId(),
      receivedAt: new Date().toISOString(),
      body,
      headers,
    };

    addToBatch(entry);

    res.writeHead(202, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ queued: true, id: entry.id }));
  };
}
