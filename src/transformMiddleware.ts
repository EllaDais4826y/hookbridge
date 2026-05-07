import { IncomingMessage, ServerResponse } from "http";

export type TransformFn = (body: Buffer, headers: Record<string, string | string[] | undefined>) => Buffer;

export interface TransformMiddlewareOptions {
  transforms: TransformFn[];
}

export function applyTransforms(
  body: Buffer,
  headers: Record<string, string | string[] | undefined>,
  transforms: TransformFn[]
): Buffer {
  return transforms.reduce((buf, fn) => fn(buf, headers), body);
}

export function createTransformMiddleware(
  options: TransformMiddlewareOptions
) {
  return function transformMiddleware(
    req: IncomingMessage,
    _res: ServerResponse,
    next: (err?: Error, body?: Buffer) => void,
    rawBody: Buffer
  ): void {
    try {
      const headers = req.headers as Record<string, string | string[] | undefined>;
      const transformed = applyTransforms(rawBody, headers, options.transforms);
      next(undefined, transformed);
    } catch (err) {
      next(err instanceof Error ? err : new Error(String(err)));
    }
  };
}

export function jsonWrapTransform(key: string): TransformFn {
  return (body: Buffer): Buffer => {
    const inner = body.toString("utf8");
    const wrapped = JSON.stringify({ [key]: JSON.parse(inner) });
    return Buffer.from(wrapped, "utf8");
  };
}

export function addHeaderFieldTransform(field: string, headerName: string): TransformFn {
  return (body: Buffer, headers): Buffer => {
    const value = headers[headerName];
    if (!value) return body;
    try {
      const obj = JSON.parse(body.toString("utf8"));
      obj[field] = Array.isArray(value) ? value[0] : value;
      return Buffer.from(JSON.stringify(obj), "utf8");
    } catch {
      return body;
    }
  };
}

/**
 * Creates a transform that renames a top-level key in a JSON body.
 * If the source key does not exist, the body is returned unchanged.
 *
 * @param fromKey - The existing key to rename.
 * @param toKey   - The new key name.
 */
export function renameKeyTransform(fromKey: string, toKey: string): TransformFn {
  return (body: Buffer): Buffer => {
    try {
      const obj = JSON.parse(body.toString("utf8"));
      if (!(fromKey in obj)) return body;
      obj[toKey] = obj[fromKey];
      delete obj[fromKey];
      return Buffer.from(JSON.stringify(obj), "utf8");
    } catch {
      return body;
    }
  };
}
