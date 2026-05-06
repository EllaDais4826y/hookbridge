import { IncomingMessage, ServerResponse } from "http";
import { tryMetricsRoute } from "./metricsRoute";
import { tryHealthRoute } from "./healthRoute";
import { fanout } from "./fanout";
import { Config } from "./config";
import { Logger } from "./logger";
import { recordRequest } from "./metrics";

export function buildRouter(config: Config, logger: Logger) {
  return async function router(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    if (tryHealthRoute(req, res)) return;
    if (tryMetricsRoute(req, res)) return;

    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "text/plain" });
      res.end("Method Not Allowed");
      return;
    }

    recordRequest();

    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    await new Promise<void>((resolve) => req.on("end", resolve));
    const body = Buffer.concat(chunks).toString();

    logger.info("incoming webhook", {
      method: req.method,
      url: req.url,
      bodyLength: body.length,
    });

    const results = await fanout(config.targets, body, logger);
    const allOk = results.every((r) => r.ok);

    const status = allOk ? 200 : 207;
    const responseBody = JSON.stringify({ results });
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(responseBody),
    });
    res.end(responseBody);
  };
}
