import { IncomingMessage, ServerResponse } from "http";
import { resetMetrics } from "./metrics";
import { Logger } from "./logger";

/**
 * Tries to handle admin routes. Returns true if the route was handled.
 *
 * Supported routes:
 *   POST /admin/reset-metrics  — resets all metrics counters
 */
export function tryAdminRoute(
  req: IncomingMessage,
  res: ServerResponse,
  logger: Logger
): boolean {
  const url = req.url ?? "";
  const method = req.method ?? "";

  if (url === "/admin/reset-metrics" && method === "POST") {
    resetMetrics();
    logger.info("metrics reset via admin endpoint");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, message: "metrics reset" }));
    return true;
  }

  if (url.startsWith("/admin")) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, message: "unknown admin route" }));
    return true;
  }

  return false;
}
