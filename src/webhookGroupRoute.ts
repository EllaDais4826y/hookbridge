import type { IncomingMessage, ServerResponse } from 'http';
import { webhookGroupHandler } from './webhookGroupHandler';

const GROUP_ROUTE_PREFIX = '/admin/groups';

export function isGroupRoute(req: IncomingMessage): boolean {
  return (req.url ?? '').startsWith(GROUP_ROUTE_PREFIX);
}

export async function tryGroupRoute(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  if (!isGroupRoute(req)) return false;
  await webhookGroupHandler(req, res);
  return true;
}
