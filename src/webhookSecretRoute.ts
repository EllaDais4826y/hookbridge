import { IncomingMessage, ServerResponse } from "http";
import { webhookSecretHandler } from "./webhookSecretHandler.js";

const SECRET_ROUTE_RE = /^\/admin\/secrets(\/[^/]+)?$/;

export function isWebhookSecretRoute(req: IncomingMessage): boolean {
  const url = req.url ?? "/";
  const path = url.split("?")[0];
  return SECRET_ROUTE_RE.test(path);
}

export async function tryWebhookSecretRoute(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  if (!isWebhookSecretRoute(req)) return false;
  const url = req.url ?? "/";
  const path = url.split("?")[0];
  await webhookSecretHandler(req, res, path);
  return true;
}
