import type { IncomingMessage, ServerResponse } from "http";
import { webhookFilterHandler } from "./webhookFilterHandler";

export function isWebhookFilterRoute(urlPath: string): boolean {
  return (
    urlPath === "/admin/webhook-filters" ||
    /^\/admin\/webhook-filters\/[^/]+$/.test(urlPath)
  );
}

export async function tryWebhookFilterRoute(
  req: IncomingMessage,
  res: ServerResponse,
  urlPath: string
): Promise<boolean> {
  if (!isWebhookFilterRoute(urlPath)) return false;
  await webhookFilterHandler(req, res, urlPath);
  return true;
}
