import type { IncomingMessage, ServerResponse } from 'http';
import {
  addNamespace,
  removeNamespace,
  getNamespace,
  listNamespaces,
  updateNamespaceEndpoints,
} from './webhookNamespace';

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(payload);
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

export async function namespaceHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', `http://localhost`);
  const parts = url.pathname.replace(/^\/admin\/namespaces\/?/, '').split('/').filter(Boolean);
  const id = parts[0];
  const subAction = parts[1];

  if (req.method === 'GET' && !id) {
    return json(res, 200, { namespaces: listNamespaces() });
  }

  if (req.method === 'GET' && id) {
    const ns = getNamespace(id);
    if (!ns) return json(res, 404, { error: 'Namespace not found' });
    return json(res, 200, ns);
  }

  if (req.method === 'POST' && !id) {
    const body = await readBody(req) as any;
    if (!body.name || !body.prefix) {
      return json(res, 400, { error: 'name and prefix are required' });
    }
    const ns = addNamespace(body.name, body.prefix, body.endpoints ?? []);
    return json(res, 201, ns);
  }

  if (req.method === 'PUT' && id && subAction === 'endpoints') {
    const body = await readBody(req) as any;
    if (!Array.isArray(body.endpoints)) {
      return json(res, 400, { error: 'endpoints must be an array' });
    }
    const updated = updateNamespaceEndpoints(id, body.endpoints);
    if (!updated) return json(res, 404, { error: 'Namespace not found' });
    return json(res, 200, updated);
  }

  if (req.method === 'DELETE' && id) {
    const removed = removeNamespace(id);
    if (!removed) return json(res, 404, { error: 'Namespace not found' });
    return json(res, 200, { ok: true });
  }

  json(res, 405, { error: 'Method not allowed' });
}
