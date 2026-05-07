import type { IncomingMessage, ServerResponse } from "http";
import { extractSignature, verifySignature, type HmacOptions } from "./hmac";

export interface HmacMiddlewareOptions extends HmacOptions {
  /** If true, missing signature header is rejected. Default: true */
  requireSignature?: boolean;
}

export function createHmacMiddleware(
  opts: HmacMiddlewareOptions,
  next: (req: IncomingMessage, res: ServerResponse, body: Buffer) => void
): (req: IncomingMessage, res: ServerResponse, body: Buffer) => void {
  const requireSignature = opts.requireSignature ?? true;

  return (req: IncomingMessage, res: ServerResponse, body: Buffer) => {
    const headerName = opts.header ?? "x-hub-signature-256";
    const signature = extractSignature(
      req.headers as Record<string, string | string[] | undefined>,
      headerName
    );

    if (!signature) {
      if (requireSignature) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing signature header" }));
        return;
      }
      return next(req, res, body);
    }

    const valid = verifySignature(body, signature, opts);
    if (!valid) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid signature" }));
      return;
    }

    next(req, res, body);
  };
}
