import { createHmac, randomBytes } from "crypto";

export interface SignedRequest {
  timestamp: number;
  nonce: string;
  signature: string;
}

export interface RequestSigningOptions {
  secret: string;
  algorithm?: string;
  toleranceMs?: number;
}

const DEFAULT_ALGORITHM = "sha256";
const DEFAULT_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes

export function generateNonce(bytes = 16): string {
  return randomBytes(bytes).toString("hex");
}

export function buildSigningPayload(
  method: string,
  path: string,
  timestamp: number,
  nonce: string,
  body: string
): string {
  return [method.toUpperCase(), path, timestamp, nonce, body].join("\n");
}

export function signRequest(
  method: string,
  path: string,
  body: string,
  options: RequestSigningOptions
): SignedRequest {
  const algorithm = options.algorithm ?? DEFAULT_ALGORITHM;
  const timestamp = Date.now();
  const nonce = generateNonce();
  const payload = buildSigningPayload(method, path, timestamp, nonce, body);
  const signature = createHmac(algorithm, options.secret)
    .update(payload)
    .digest("hex");
  return { timestamp, nonce, signature };
}

export function verifyRequestSignature(
  method: string,
  path: string,
  body: string,
  signed: SignedRequest,
  options: RequestSigningOptions
): boolean {
  const toleranceMs = options.toleranceMs ?? DEFAULT_TOLERANCE_MS;
  const age = Math.abs(Date.now() - signed.timestamp);
  if (age > toleranceMs) {
    return false;
  }
  const algorithm = options.algorithm ?? DEFAULT_ALGORITHM;
  const payload = buildSigningPayload(method, path, signed.timestamp, signed.nonce, body);
  const expected = createHmac(algorithm, options.secret)
    .update(payload)
    .digest("hex");
  return expected === signed.signature;
}
