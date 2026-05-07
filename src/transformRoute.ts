import { IncomingMessage, ServerResponse } from "http";
import { applyTransforms, TransformFn } from "./transformMiddleware";

export interface TransformRouteConfig {
  path: string;
  transforms: TransformFn[];
}

export function isTransformRoute(
  req: IncomingMessage,
  config: TransformRouteConfig[]
): TransformRouteConfig | undefined {
  const url = req.url ?? "/";
  return config.find((c) => url === c.path || url.startsWith(c.path + "?"));
}

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
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "transform_failed",
        message: err instanceof Error ? err.message : String(err),
      })
    );
    return { matched: true, body };
  }
}
