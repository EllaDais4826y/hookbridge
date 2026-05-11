import type { IncomingMessage, ServerResponse } from "http";
import { webhookTaggingHandler } from "./webhookTaggingHandler";

export function isTaggingRoute(req: IncomingMessage): boolean {
  const url = req.url ?? "/";
  return url.startsWith("/admin/tags");
}

export async function tryTaggingRoute(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  if (!isTaggingRoute(req)) return false;
  await webhookTaggingHandler(req, res);
  return true;
}
