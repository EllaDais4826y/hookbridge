import { IncomingMessage, ServerResponse } from "http";
import { verifyRequestSignature, SignedRequest } from "./requestSigning";

export interface RequestSigningMiddlewareOptions {
  secret: string;
  algorithm?: string;
  toleranceMs?: number;
  timestampHeader?: string;
  nonceHeader?: string;
  signatureHeader?: string;
}

const DEFAULTS = {
  timestampHeader: "x-hookbridge-timestamp",
  nonceHeader: "x-hookbridge-nonce",
  signatureHeader: "x-hookbridge-signature",
};

export function createRequestSigningMiddleware(
  options: RequestSigningMiddlewareOptions
) {
  const timestampHeader = options.timestampHeader ?? DEFAULTS.timestampHeader;
  const nonceHeader = options.nonceHeader ?? DEFAULTS.nonceHeader;
  const signatureHeader = options.signatureHeader ?? DEFAULTS.signatureHeader;

  return function requestSigningMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    body: string,
    next: () => void
  ): void {
    const rawTimestamp = req.headers[timestampHeader];
    const nonce = req.headers[nonceHeader];
    const signature = req.headers[signatureHeader];

    if (!rawTimestamp || !nonce || !signature) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing signing headers" }));
      return;
    }

    const timestamp = parseInt(String(rawTimestamp), 10);
    if (isNaN(timestamp)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid timestamp header" }));
      return;
    }

    const signed: SignedRequest = {
      timestamp,
      nonce: String(nonce),
      signature: String(signature),
    };

    const method = req.method ?? "GET";
    const path = req.url ?? "/";

    const valid = verifyRequestSignature(method, path, body, signed, {
      secret: options.secret,
      algorithm: options.algorithm,
      toleranceMs: options.toleranceMs,
    });

    if (!valid) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid request signature" }));
      return;
    }

    next();
  };
}
