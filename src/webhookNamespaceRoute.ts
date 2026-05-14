import type { IncomingMessage, ServerResponse } from 'http';
import { namespaceHandler } from './webhookNamespaceHandler';

const NAMESPACE_ROUTE_PREFIX = '/admin/namespaces';

export function isNamespaceRoute(req: IncomingMessage): boolean {
  return (req.url ?? '').startsWith(NAMESPACE_ROUTE_PREFIX);
}

export async function tryNamespaceRoute(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  if (!isNamespaceRoute(req)) return false;
  await namespaceHandler(req, res);
  return true;
}
