import type { IncomingMessage, ServerResponse } from 'http';
import { isGroupRoute, tryGroupRoute } from './webhookGroupRoute';
import { clearGroups, addGroup } from './webhookGroup';

beforeEach(() => clearGroups());

function makeReq(method: string, url: string, body = '{}'): IncomingMessage {
  const { EventEmitter } = require('events');
  const req = new EventEmitter() as IncomingMessage;
  (req as any).method = method;
  (req as any).url = url;
  process.nextTick(() => {
    req.emit('data', body);
    req.emit('end');
  });
  return req;
}

function makeRes(): { res: ServerResponse; status: () => number; body: () => string } {
  let _status = 0;
  let _body = '';
  const res = {
    writeHead(s: number) { _status = s; },
    end(b: string) { _body = b; },
  } as unknown as ServerResponse;
  return { res, status: () => _status, body: () => _body };
}

test('isGroupRoute matches /admin/groups prefix', () => {
  expect(isGroupRoute(makeReq('GET', '/admin/groups'))).toBe(true);
  expect(isGroupRoute(makeReq('GET', '/admin/groups/abc'))).toBe(true);
  expect(isGroupRoute(makeReq('GET', '/admin/other'))).toBe(false);
});

test('tryGroupRoute returns false for non-group routes', async () => {
  const { res } = makeRes();
  const req = makeReq('GET', '/health');
  const handled = await tryGroupRoute(req, res);
  expect(handled).toBe(false);
});

test('tryGroupRoute GET /admin/groups returns empty list', async () => {
  const { res, status, body } = makeRes();
  const req = makeReq('GET', '/admin/groups');
  const handled = await tryGroupRoute(req, res);
  expect(handled).toBe(true);
  expect(status()).toBe(200);
  expect(JSON.parse(body())).toEqual([]);
});

test('tryGroupRoute POST creates a group', async () => {
  const { res, status, body } = makeRes();
  const payload = JSON.stringify({ name: 'mygroup', endpoints: ['https://ep.com'] });
  const req = makeReq('POST', '/admin/groups', payload);
  await tryGroupRoute(req, res);
  expect(status()).toBe(201);
  const parsed = JSON.parse(body());
  expect(parsed.name).toBe('mygroup');
  expect(parsed.endpoints).toEqual(['https://ep.com']);
});

test('tryGroupRoute GET by id returns group', async () => {
  const g = addGroup('fetched', ['https://x.com']);
  const { res, status, body } = makeRes();
  const req = makeReq('GET', `/admin/groups/${g.id}`);
  await tryGroupRoute(req, res);
  expect(status()).toBe(200);
  expect(JSON.parse(body()).id).toBe(g.id);
});

test('tryGroupRoute DELETE removes group', async () => {
  const g = addGroup('to-delete', []);
  const { res, status, body } = makeRes();
  const req = makeReq('DELETE', `/admin/groups/${g.id}`);
  await tryGroupRoute(req, res);
  expect(status()).toBe(200);
  expect(JSON.parse(body()).ok).toBe(true);
});

test('tryGroupRoute DELETE unknown id returns 404', async () => {
  const { res, status } = makeRes();
  const req = makeReq('DELETE', '/admin/groups/nope');
  await tryGroupRoute(req, res);
  expect(status()).toBe(404);
});
