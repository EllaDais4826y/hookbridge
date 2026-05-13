/**
 * Webhook correlation ID tracking.
 * Attaches and propagates a correlation ID across fanout requests.
 */

const CORRELATION_HEADER = "x-correlation-id";

let correlationMap: Map<string, string[]> = new Map();

export function generateCorrelationId(): string {
  return `corr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function recordCorrelation(correlationId: string, requestId: string): void {
  const existing = correlationMap.get(correlationId) ?? [];
  if (!existing.includes(requestId)) {
    existing.push(requestId);
  }
  correlationMap.set(correlationId, existing);
}

export function getCorrelatedRequests(correlationId: string): string[] {
  return correlationMap.get(correlationId) ?? [];
}

export function listCorrelations(): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [key, val] of correlationMap.entries()) {
    result[key] = val;
  }
  return result;
}

export function removeCorrelation(correlationId: string): boolean {
  return correlationMap.delete(correlationId);
}

export function clearCorrelations(): void {
  correlationMap = new Map();
}

export function correlationCount(): number {
  return correlationMap.size;
}

export function extractCorrelationId(
  headers: Record<string, string | string[] | undefined>
): string | undefined {
  const val = headers[CORRELATION_HEADER];
  if (!val) return undefined;
  return Array.isArray(val) ? val[0] : val;
}

export function injectCorrelationHeader(
  headers: Record<string, string>,
  correlationId: string
): Record<string, string> {
  return { ...headers, [CORRELATION_HEADER]: correlationId };
}
