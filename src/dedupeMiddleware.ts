import type { IncomingMessage, ServerResponse } from "http";
import { isDuplicate, markSeen } from "./dedupe.js";
import type { createLogger } from "./logger.js";

export type DedupeIdExtractor = (req: IncomingMessage, body: string) => string | null;

export interface DedupeMiddlewareOptions {
  /** Extract a deduplication ID from the request. Return null to skip dedup. */
  extractId?: DedupeIdExtractor;
  logger?: ReturnType<typeof createLogger>;
}

const defaultExtractor: DedupeIdExtractor = (req) => {
  const header =
    req.headers["x-webhook-id"] ??
    req.headers["x-event-id"] ??
    req.headers["x-delivery-id"];
  return typeof header === "string" ? header : null;
};

export function createDedupeMiddleware(options: DedupeMiddlewareOptions = {}) {
  const extractId = options.extractId ?? defaultExtractor;
  const logger = options.logger;

  return function dedupeMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    body: string,
    next: () => void
  ): void {
    const id = extractId(req, body);

    if (id === null) {
      next();
      return;
    }

    if (isDuplicate(id)) {
      logger?.info({ msg: "duplicate event suppressed", id });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "duplicate", id }));
      return;
    }

    markSeen(id);
    next();
  };
}
