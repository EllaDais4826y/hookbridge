import { IncomingMessage, ServerResponse } from "http";
import { healthHandler } from "./healthHandler";

/**
 * Intercepts GET /health requests and responds with health status.
 * Returns true if the request was handled, false otherwise.
 */
export function tryHealthRoute(
  req: IncomingMessage,
  res: ServerResponse
): boolean {
  if (req.method === "GET" && req.url === "/health") {
    healthHandler(req, res);
    return true;
  }
  return false;
}

/**
 * Returns true if the given request matches the health route.
 * Useful for logging or middleware that needs to identify health checks
 * without executing the handler.
 */
export function isHealthRoute(req: IncomingMessage): boolean {
  return req.method === "GET" && req.url === "/health";
}
