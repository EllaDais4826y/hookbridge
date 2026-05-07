/**
 * Admin route for inspecting and updating the event filter configuration
 * at runtime via GET/PUT /admin/event-filter.
 */

import { IncomingMessage, ServerResponse } from "http";
import { EventFilterOptions } from "./eventFilter";

let currentOptions: EventFilterOptions = {
  headerName: "x-event-type",
  allowedEvents: [],
};

export function getEventFilterOptions(): EventFilterOptions {
  return { ...currentOptions, allowedEvents: [...currentOptions.allowedEvents] };
}

export function setEventFilterOptions(opts: EventFilterOptions): void {
  currentOptions = {
    headerName: opts.headerName,
    allowedEvents: opts.allowedEvents.map((e) => e.toLowerCase()),
  };
}

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(payload);
}

export function isEventFilterRoute(req: IncomingMessage): boolean {
  return (req.url ?? "").split("?")[0] === "/admin/event-filter";
}

export async function tryEventFilterRoute(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  if (!isEventFilterRoute(req)) return false;

  if (req.method === "GET") {
    json(res, 200, getEventFilterOptions());
    return true;
  }

  if (req.method === "PUT") {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    let body: unknown;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString());
    } catch {
      json(res, 400, { error: "invalid_json" });
      return true;
    }
    const b = body as Record<string, unknown>;
    if (
      typeof b.headerName !== "string" ||
      !Array.isArray(b.allowedEvents) ||
      !b.allowedEvents.every((v) => typeof v === "string")
    ) {
      json(res, 400, { error: "invalid_payload" });
      return true;
    }
    setEventFilterOptions({
      headerName: b.headerName,
      allowedEvents: b.allowedEvents as string[],
    });
    json(res, 200, getEventFilterOptions());
    return true;
  }

  json(res, 405, { error: "method_not_allowed" });
  return true;
}
