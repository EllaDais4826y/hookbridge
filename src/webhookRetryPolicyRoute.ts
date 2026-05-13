import { IncomingMessage, ServerResponse } from "http";
import { retryPolicyHandler } from "./webhookRetryPolicyHandler";

export function isRetryPolicyRoute(req: IncomingMessage): boolean {
  const url = req.url ?? "";
  return url.startsWith("/admin/retry-policies");
}

export async function tryRetryPolicyRoute(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  if (!isRetryPolicyRoute(req)) return false;
  await retryPolicyHandler(req, res);
  return true;
}
