/**
 * Middleware that forwards selected incoming request headers to all fanout
 * upstream requests.  The set of headers to forward is driven by the
 * "forwardHeaders" config field (case-insensitive glob list).
 */

import { IncomingMessage, ServerResponse } from "http";

export type NextFn = () => void;

/**
 * Returns true when `header` matches any of the provided patterns.
 * Patterns are case-insensitive; "*" is a wildcard that matches everything.
 */
export function headerMatches(header: string, patterns: string[]): boolean {
  const lower = header.toLowerCase();
  return patterns.some((p) => {
    const pat = p.toLowerCase();
    if (pat === "*") return true;
    if (pat.endsWith("*")) return lower.startsWith(pat.slice(0, -1));
    return lower === pat;
  });
}

/**
 * Extracts the subset of `headers` whose names match `patterns`.
 */
export function pickHeaders(
  headers: Record<string, string | string[] | undefined>,
  patterns: string[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!headerMatches(key, patterns)) continue;
    if (Array.isArray(value)) {
      result[key] = value.join(", ");
    } else if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Creates a middleware that attaches forwarded headers to `req` under
 * `req.forwardedHeaders` so that the fanout layer can include them.
 */
export function createHeaderForwardMiddleware(
  patterns: string[]
): (req: IncomingMessage & { forwardedHeaders?: Record<string, string> }, res: ServerResponse, next: NextFn) => void {
  return (req, _res, next) => {
    if (patterns.length > 0) {
      req.forwardedHeaders = pickHeaders(
        req.headers as Record<string, string | string[] | undefined>,
        patterns
      );
    } else {
      req.forwardedHeaders = {};
    }
    next();
  };
}
