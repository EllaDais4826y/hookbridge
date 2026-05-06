import type { IncomingMessage, ServerResponse } from "node:http";
import { metricsHandler } from "./metricsHandler";

const METRICS_PATH = "/_metrics";

/**
 * Middleware that intercepts GET /_metrics requests and delegates to
 * metricsHandler. Returns true if the request was handled, false otherwise.
 */
export function tryMetricsRoute(
  req: IncomingMessage,
  res: ServerResponse
): boolean {
  if (req.method === "GET" && req.url === METRICS_PATH) {
    metricsHandler(req, res);
    return true;
  }
  return false;
}
