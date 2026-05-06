import { IncomingMessage, ServerResponse } from "http";
import { getMetrics } from "./metrics";

export interface HealthStatus {
  status: "ok" | "degraded";
  uptime: number;
  timestamp: string;
  metrics: {
    totalRequests: number;
    totalFailures: number;
    successRate: string;
  };
}

const startTime = Date.now();

export function healthHandler(
  _req: IncomingMessage,
  res: ServerResponse
): void {
  const metrics = getMetrics();
  const total = metrics.totalRequests;
  const failures = metrics.totalFailures;
  const successRate =
    total === 0 ? "100.00" : (((total - failures) / total) * 100).toFixed(2);

  const degraded = total > 0 && parseFloat(successRate) < 50;

  const body: HealthStatus = {
    status: degraded ? "degraded" : "ok",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    metrics: {
      totalRequests: total,
      totalFailures: failures,
      successRate: `${successRate}%`,
    },
  };

  const payload = JSON.stringify(body);
  res.writeHead(degraded ? 503 : 200, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}
