import type { IncomingMessage, ServerResponse } from 'http';
import { isNamespaceRoute, tryNamespaceRoute } from './webhookNamespaceRoute';
import { clearNamespaces, addNamespace } from './webhookNamespace';

beforeEach(() => clearNamespaces());

function makeReq(method: string, url: string, body?: unknown): IncomingMessage {
  const { EventEmitter } = require('events');
  const req = new EventEmitter() as any;
  req.method = method;
  req.url = url;
  if (body !== undefined) {
    const payload = JSON.stringify(body);
    process.nextTick(() => {
      req.emit('data', payload);
      req.emit('end');
    });
  } else {
    process.nextTick(() => req.emit('end'));
  }
  return req;
}

function makeRes(): { res: ServerResponse; status: number | null; body: string } {
  const captured: { status: number | null; body: string } = { status: null, body: '' };
  const res = {
    writeHead(s: number) { captured.status = s; },
    end(b: string) { captured.body = b; },
  } as unknown as ServerResponse;
  return { res, ...captured, get status() { return captured.status; }, get body() { return captured.body; } };
}

describe('isNamespaceRoute', () => {
  it('returns true for /admin/namespaces', () => {
    expect(isNamespaceRoute(makeReq('GET', '/admin/namespaces'))).toBe(true);
  });

  it('returns false for unrelated routes', () => {
    expect(isNamespaceRoute(makeReq('GET', '/webhook'))).toBe(false);
  });
});

describe('tryNamespaceRoute', () => {
  it('returns false for non-namespace routes', async () => {
    const req = makeReq('GET', '/health');
    const { res } = makeRes();
    const result = await tryNamespaceRoute(req, res);
    expect(result).toBe(false);
  });

  it('handles GET /admin/namespaces', async () => {
    addNamespace('test', '/test', ['https://example.com']);
    const req = makeReq('GET', '/admin/namespaces');
    const captured = { status: 0, body: '' };
    const res = {
      writeHead(s: number) { captured.status = s; },
      end(b: string) { captured.body = b; },
    } as unknown as ServerResponse;
    const result = await tryNamespaceRoute(req, res);
    expect(result).toBe(true);
    expect(captured.status).toBe(200);
    const parsed = JSON.parse(captured.body);
    expect(parsed.namespaces).toHaveLength(1);
    expect(parsed.namespaces[0].name).toBe('test');
  });

  it('returns 404 for unknown namespace id', async () => {
    const req = makeReq('GET', '/admin/namespaces/unknown_id');
    const captured = { status: 0, body: '' };
    const res = {
      writeHead(s: number) { captured.status = s; },
      end(b: string) { captured.body = b; },
    } as unknown as ServerResponse;
    await tryNamespaceRoute(req, res);
    expect(captured.status).toBe(404);
  });
});
