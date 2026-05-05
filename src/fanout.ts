import { computeDelay, sleep } from './retry';

export interface Endpoint {
  url: string;
  headers?: Record<string, string>;
}

export interface FanoutOptions {
  maxRetries?: number;
  timeoutMs?: number;
}

export interface DeliveryResult {
  url: string;
  success: boolean;
  attempts: number;
  statusCode?: number;
  error?: string;
}

export async function deliverToEndpoint(
  endpoint: Endpoint,
  payload: unknown,
  options: FanoutOptions = {}
): Promise<DeliveryResult> {
  const { maxRetries = 3, timeoutMs = 5000 } = options;
  const body = JSON.stringify(payload);
  let attempts = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    attempts++;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...endpoint.headers,
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (response.ok) {
        return { url: endpoint.url, success: true, attempts, statusCode: response.status };
      }

      if (attempt < maxRetries) {
        await sleep(computeDelay(attempt));
      } else {
        return { url: endpoint.url, success: false, attempts, statusCode: response.status };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      if (attempt < maxRetries) {
        await sleep(computeDelay(attempt));
      } else {
        return { url: endpoint.url, success: false, attempts, error };
      }
    }
  }

  return { url: endpoint.url, success: false, attempts };
}

export async function fanout(
  endpoints: Endpoint[],
  payload: unknown,
  options: FanoutOptions = {}
): Promise<DeliveryResult[]> {
  return Promise.all(endpoints.map((ep) => deliverToEndpoint(ep, payload, options)));
}
