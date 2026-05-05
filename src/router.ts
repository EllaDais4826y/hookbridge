import { IncomingMessage, ServerResponse } from 'http';
import { fanout, Endpoint, FanoutOptions, DeliveryResult } from './fanout';

export interface RouteConfig {
  path: string;
  endpoints: Endpoint[];
  fanoutOptions?: FanoutOptions;
}

export interface WebhookEvent {
  receivedAt: string;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}

export async function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve(raw);
      }
    });
    req.on('error', reject);
  });
}

export function buildRouter(routes: RouteConfig[]) {
  const routeMap = new Map(routes.map((r) => [r.path, r]));

  return async function handler(req: IncomingMessage, res: ServerResponse) {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      return;
    }

    const url = req.url ?? '/';
    const route = routeMap.get(url);

    if (!route) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No route configured for this path' }));
      return;
    }

    const body = await readBody(req);
    const event: WebhookEvent = {
      receivedAt: new Date().toISOString(),
      headers: req.headers as Record<string, string | string[] | undefined>,
      body,
    };

    const results: DeliveryResult[] = await fanout(route.endpoints, event, route.fanoutOptions);
    const allOk = results.every((r) => r.success);

    res.writeHead(allOk ? 200 : 207, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ results }));
  };
}
