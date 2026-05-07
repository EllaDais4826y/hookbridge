import { IncomingMessage, ServerResponse } from "http";
import { applyTransforms, TransformFn } from "./transformMiddleware";

export interface TransformRouteConfig {
  path: string;
  transforms: TransformFn[];
}

/**
 * Checks whether the incoming request matches any configured transform route.
 * Matches on exact path or path with query string, but not on partial path segments
 * (e.g. "/hook" will not match "/hooks").
 */
export function isTransformRoute(
  req: IncomingMessage,
  config: TransformRouteConfig[]
): TransformRouteConfig | undefined {
  const url = req.url ?? "/";
  return config.find((c) => url === c.path || url.startsWith(c.path + "?"));
}

/**
 * Attempts to apply transforms for a matching route.
 * Returns whether a route was matched and the (possibly transformed) body.
 * If transformation fails, writes a 400 response and returns the original body.
 */
export function tryTransformRoute(
  req: IncomingMessage,
  res: ServerResponse,
  body: Buffer,
  config: TransformRouteConfig[]
): { matched: boolean; body: Buffer } {
  const route = isTransformRoute(req, config);
  if (!route) {
    return { matched: false, body };
  }

  try {
    const headers = req.headers as Record<string, string | string[] | undefined>;
    const transformed = applyTransforms(body, headers, route.transforms);
    return { matched: true, body: transformed };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[hookbridge] Transform failed for path "${route.path}": ${message}`);
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "transform_failed",
        message,
      })
    );
    return { matched: true, body };
  }
}
