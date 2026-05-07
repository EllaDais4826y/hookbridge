import { createHmac, timingSafeEqual } from "crypto";

export interface HmacOptions {
  secret: string;
  algorithm?: string;
  header?: string;
  prefix?: string;
}

const DEFAULT_ALGORITHM = "sha256";
const DEFAULT_HEADER = "x-hub-signature-256";
const DEFAULT_PREFIX = "sha256=";

export function computeSignature(
  body: Buffer | string,
  secret: string,
  algorithm: string = DEFAULT_ALGORITHM
): string {
  const hmac = createHmac(algorithm, secret);
  hmac.update(typeof body === "string" ? Buffer.from(body) : body);
  return hmac.digest("hex");
}

export function buildSignatureHeader(
  body: Buffer | string,
  opts: HmacOptions
): string {
  const algorithm = opts.algorithm ?? DEFAULT_ALGORITHM;
  const prefix = opts.prefix ?? DEFAULT_PREFIX;
  const sig = computeSignature(body, opts.secret, algorithm);
  return `${prefix}${sig}`;
}

export function verifySignature(
  body: Buffer | string,
  signature: string,
  opts: HmacOptions
): boolean {
  const algorithm = opts.algorithm ?? DEFAULT_ALGORITHM;
  const prefix = opts.prefix ?? DEFAULT_PREFIX;
  const expected = `${prefix}${computeSignature(body, opts.secret, algorithm)}`;
  try {
    return timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(signature, "utf8")
    );
  } catch {
    return false;
  }
}

export function extractSignature(
  headers: Record<string, string | string[] | undefined>,
  headerName: string = DEFAULT_HEADER
): string | undefined {
  const val = headers[headerName.toLowerCase()];
  if (Array.isArray(val)) return val[0];
  return val;
}
