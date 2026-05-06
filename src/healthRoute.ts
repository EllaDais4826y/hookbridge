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
