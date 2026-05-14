import type { IncomingMessage, ServerResponse } from 'http';
import {
  addGroup,
  removeGroup,
  getGroup,
  listGroups,
  updateGroup,
} from './webhookGroup';

function json(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body);
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); } catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

export async function webhookGroupHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', `http://localhost`);
  const parts = url.pathname.replace(/^\/admin\/groups/, '').split('/').filter(Boolean);
  const id = parts[0];
  const method = req.method ?? 'GET';

  if (!id && method === 'GET') {
    return json(res, 200, listGroups());
  }

  if (!id && method === 'POST') {
    const body = await readBody(req) as Record<string, unknown>;
    if (!body.name || typeof body.name !== 'string') {
      return json(res, 400, { error: 'name is required' });
    }
    const endpoints = Array.isArray(body.endpoints) ? (body.endpoints as string[]) : [];
    const description = typeof body.description === 'string' ? body.description : undefined;
    const group = addGroup(body.name, endpoints, description);
    return json(res, 201, group);
  }

  if (id && method === 'GET') {
    const group = getGroup(id);
    if (!group) return json(res, 404, { error: 'not found' });
    return json(res, 200, group);
  }

  if (id && method === 'PATCH') {
    const body = await readBody(req) as Record<string, unknown>;
    const updated = updateGroup(id, {
      ...(typeof body.name === 'string' ? { name: body.name } : {}),
      ...(typeof body.description === 'string' ? { description: body.description } : {}),
      ...(Array.isArray(body.endpoints) ? { endpoints: body.endpoints as string[] } : {}),
    });
    if (!updated) return json(res, 404, { error: 'not found' });
    return json(res, 200, updated);
  }

  if (id && method === 'DELETE') {
    const ok = removeGroup(id);
    if (!ok) return json(res, 404, { error: 'not found' });
    return json(res, 200, { ok: true });
  }

  json(res, 405, { error: 'method not allowed' });
}
