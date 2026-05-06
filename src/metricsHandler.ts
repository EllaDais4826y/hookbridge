import type { IncomingMessage, ServerResponse } from "node:http";
import { getMetrics } from "./metrics";

export function metricsHandler(
  _req: IncomingMessage,
  res: ServerResponse
): void {
  const metrics = getMetrics();
  const body = JSON.stringify(metrics, null, 2);
  res.writeHead(200, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}
