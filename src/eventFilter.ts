/**
 * Event filtering middleware: allows or blocks incoming webhook events
 * based on a configurable list of allowed event types read from the
 * X-Event-Type header (e.g. GitHub's X-GitHub-Event).
 */

import { IncomingMessage, ServerResponse } from "http";

export interface EventFilterOptions {
  /** Header name to inspect for the event type */
  headerName: string;
  /** Set of allowed event type values; if empty, all events are allowed */
  allowedEvents: string[];
}

export function isEventAllowed(
  eventType: string | undefined,
  allowedEvents: string[]
): boolean {
  if (allowedEvents.length === 0) return true;
  if (!eventType) return false;
  return allowedEvents.includes(eventType.toLowerCase());
}

export function createEventFilterMiddleware(
  options: EventFilterOptions
) {
  const allowed = options.allowedEvents.map((e) => e.toLowerCase());

  return function eventFilterMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void
  ): void {
    const raw = req.headers[options.headerName.toLowerCase()];
    const eventType = Array.isArray(raw) ? raw[0] : raw;

    if (!isEventAllowed(eventType, allowed)) {
      res.writeHead(422, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "event_type_not_allowed",
          received: eventType ?? null,
          allowed: allowed.length > 0 ? allowed : "*",
        })
      );
      return;
    }

    next();
  };
}
