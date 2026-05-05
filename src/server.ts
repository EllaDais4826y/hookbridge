import http from 'http';
import { buildRouter, RouteConfig } from './router';

export interface ServerConfig {
  port?: number;
  routes: RouteConfig[];
}

export function createServer(config: ServerConfig): http.Server {
  const { port = 3000, routes } = config;
  const handler = buildRouter(routes);
  const server = http.createServer(handler);

  server.on('listening', () => {
    console.log(`[hookbridge] Listening on port ${port}`);
    console.log(`[hookbridge] Registered routes: ${routes.map((r) => r.path).join(', ')}`);
  });

  server.on('error', (err) => {
    console.error('[hookbridge] Server error:', err.message);
  });

  return server;
}

export function startServer(config: ServerConfig): http.Server {
  const { port = 3000 } = config;
  const server = createServer(config);
  server.listen(port);
  return server;
}

// Allow running directly: ts-node src/server.ts
if (require.main === module) {
  const exampleConfig: ServerConfig = {
    port: Number(process.env.PORT ?? 3000),
    routes: [
      {
        path: '/hooks/github',
        endpoints: [
          { url: process.env.ENDPOINT_1 ?? 'http://localhost:4001/receive' },
          { url: process.env.ENDPOINT_2 ?? 'http://localhost:4002/receive' },
        ],
        fanoutOptions: { maxRetries: 3, timeoutMs: 5000 },
      },
    ],
  };
  startServer(exampleConfig);
}
