import { IncomingMessage, ServerResponse } from "http";
import { isIpAllowed, IpFilterConfig } from "./ipFilter";

/**
 * Route handler that exposes the current IP filter config
 * and provides a test endpoint for checking if an IP is allowed.
 *
 * GET  /admin/ip-filter         — returns current config
 * POST /admin/ip-filter/check   — body: { "ip": "1.2.3.4" }
 */
export function tryIpFilterRoute(
  req: IncomingMessage,
  res: ServerResponse,
  config: IpFilterConfig
): boolean {
  const url = req.url ?? "";

  if (url === "/admin/ip-filter" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ config }));
    return true;
  }

  if (url === "/admin/ip-filter/check" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        const { ip } = JSON.parse(body);
        if (typeof ip !== "string") {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "ip field required" }));
          return;
        }
        const allowed = isIpAllowed(ip, config);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ip, allowed }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return true;
  }

  return false;
}
