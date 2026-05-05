import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildRouter, readBody } from './router';
import { EventEmitter } from 'events';

const mockFanout = vi.fn();
vi.mock('./fanout', () => ({ fanout: (...args: unknown[]) => mockFanout(...args) }));

function makeReq(method: string, url: string, body = '') {
  const req = new EventEmitter() as any;
  req.method = method;
  req.url = url;
  req.headers = { 'content-type': 'application/json' };
  req.setEncoding = vi.fn();
  setTimeout(() => {
    req.emit('data', body);
    req.emit('end');
  }, 0);
  return req;
}

function makeRes() {
  const res = { statusCode: 0, body: '', headers: {} } as any;
  res.writeHead = vi.fn((code: number, headers: object) => {
    res.statusCode = code;
    res.headers = headers;
  });
  res.end = vi.fn((data: string) => { res.body = data; });
  return res;
}

beforeEach(() => mockFanout.mockReset());

describe('buildRouter', () => {
  const routes = [{ path: '/hooks/orders', endpoints: [{ url: 'https://svc.example.com' }] }];

  it('returns 405 for non-POST requests', async () => {
    const handler = buildRouter(routes);
    const req = makeReq('GET', '/hooks/orders');
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it('returns 404 for unknown paths', async () => {
    const handler = buildRouter(routes);
    const req = makeReq('POST', '/hooks/unknown', '{}');
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(404);
  });

  it('returns 200 when all deliveries succeed', async () => {
    mockFanout.mockResolvedValue([{ url: 'https://svc.example.com', success: true, attempts: 1 }]);
    const handler = buildRouter(routes);
    const req = makeReq('POST', '/hooks/orders', JSON.stringify({ orderId: 1 }));
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body);
    expect(parsed.results[0].success).toBe(true);
  });

  it('returns 207 when some deliveries fail', async () => {
    mockFanout.mockResolvedValue([
      { url: 'https://a.example.com', success: true, attempts: 1 },
      { url: 'https://b.example.com', success: false, attempts: 3 },
    ]);
    const handler = buildRouter(routes);
    const req = makeReq('POST', '/hooks/orders', '{}');
    const res = makeRes();
    await handler(req, res);
    expect(res.statusCode).toBe(207);
  });
});
