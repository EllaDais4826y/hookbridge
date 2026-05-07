export interface RequestLogEntry {
  id: string;
  timestamp: number;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  clientIp: string;
  fanoutTargets: number;
  fanoutSuccesses: number;
}

const MAX_ENTRIES = 200;

const log: RequestLogEntry[] = [];

export function recordRequestLog(entry: RequestLogEntry): void {
  log.unshift(entry);
  if (log.length > MAX_ENTRIES) {
    log.length = MAX_ENTRIES;
  }
}

export function listRequestLogs(limit = 50): RequestLogEntry[] {
  return log.slice(0, Math.min(limit, MAX_ENTRIES));
}

export function clearRequestLogs(): void {
  log.length = 0;
}

export function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
