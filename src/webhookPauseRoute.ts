import type { IncomingMessage, ServerResponse } from "http";
import { webhookPauseHandler } from "./webhookPauseHandler";
import { isPaused } from "./webhookPause";

const PAUSE_ROUTE_PREFIX = "/__hookbridge/pause";

export function isPauseRoute(req: IncomingMessage): boolean {
  return (req.url ?? "").startsWith(PAUSE_ROUTE_PREFIX);
}

export async function tryPauseRoute(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  if (!isPauseRoute(req)) return false;
  await webhookPauseHandler(req, res);
  return true;
}

/**
 * Middleware helper: returns 503 if the request's target endpoint is paused.
 * Intended to be called in the fanout pipeline before dispatching.
 */
export function checkEndpointPaused(
  target: string,
  res: ServerResponse
): boolean {
  if (isPaused(target)) {
    const body = JSON.stringify({ error: "Endpoint is paused", target });
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(body);
    return true;
  }
  return false;
}
