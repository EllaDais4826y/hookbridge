import { IncomingMessage, ServerResponse } from "http";
import { getMetrics } from "./metrics";
import { fanout } from "./fanout";
import { Config } from "./config";
import { Logger } from "./logger";

export interface ReplayResult {
  replayed: number;
  failed: number;
  skipped: number;
}

export async function replayHandler(
  req: IncomingMessage,
  res: ServerResponse,
  config: Config,
  logger: Logger
): Promise<void> {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
    return;
  }

  const metrics = getMetrics();
  const failed = metrics.fanout.failed;

  if (failed === 0) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ replayed: 0, failed: 0, skipped: 0 }));
    return;
  }

  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = body ? JSON.parse(body) : {};
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid JSON body" }));
    return;
  }

  const rawBody = Buffer.from(body);
  const results = await fanout(rawBody, config.targets, logger);

  const replayed = results.filter((r) => r.success).length;
  const stillFailed = results.filter((r) => !r.success).length;

  const result: ReplayResult = {
    replayed,
    failed: stillFailed,
    skipped: 0,
  };

  logger.info("replay completed", result as unknown as Record<string, unknown>);

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(result));
}
