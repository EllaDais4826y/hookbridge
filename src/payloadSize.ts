/**
 * Payload size limiting middleware.
 * Rejects incoming requests whose body exceeds a configurable byte limit.
 */

import { IncomingMessage, ServerResponse } from "http";

export interface PayloadSizeOptions {
  maxBytes: number;
}

const DEFAULT_MAX_BYTES = 1024 * 256; // 256 KB

let currentOptions: PayloadSizeOptions = { maxBytes: DEFAULT_MAX_BYTES };

export function configurePayloadSize(opts: Partial<PayloadSizeOptions>): void {
  currentOptions = { ...currentOptions, ...opts };
}

export function getPayloadSizeOptions(): PayloadSizeOptions {
  return { ...currentOptions };
}

export function resetPayloadSizeOptions(): void {
  currentOptions = { maxBytes: DEFAULT_MAX_BYTES };
}

export function createPayloadSizeMiddleware(
  opts?: Partial<PayloadSizeOptions>
) {
  const maxBytes = opts?.maxBytes ?? currentOptions.maxBytes;

  return function payloadSizeMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: Error) => void
  ): void {
    const contentLength = req.headers["content-length"];

    if (contentLength !== undefined) {
      const length = parseInt(contentLength, 10);
      if (!isNaN(length) && length > maxBytes) {
        res.writeHead(413, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Payload Too Large",
            maxBytes,
            receivedBytes: length,
          })
        );
        return;
      }
    }

    let received = 0;
    let rejected = false;

    req.on("data", (chunk: Buffer) => {
      received += chunk.length;
      if (!rejected && received > maxBytes) {
        rejected = true;
        res.writeHead(413, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Payload Too Large",
            maxBytes,
          })
        );
        req.destroy();
      }
    });

    req.on("end", () => {
      if (!rejected) next();
    });

    req.on("error", (err) => {
      if (!rejected) next(err);
    });
  };
}
