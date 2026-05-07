import { describe, it, expect } from "vitest";
import {
  computeSignature,
  buildSignatureHeader,
  verifySignature,
  extractSignature,
} from "./hmac";

const SECRET = "test-secret";
const BODY = Buffer.from('{"event":"push"}');

describe("computeSignature", () => {
  it("returns a hex string", () => {
    const sig = computeSignature(BODY, SECRET);
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic", () => {
    expect(computeSignature(BODY, SECRET)).toBe(computeSignature(BODY, SECRET));
  });

  it("differs with different secrets", () => {
    expect(computeSignature(BODY, SECRET)).not.toBe(
      computeSignature(BODY, "other-secret")
    );
  });
});

describe("buildSignatureHeader", () => {
  it("prepends the prefix", () => {
    const header = buildSignatureHeader(BODY, { secret: SECRET });
    expect(header.startsWith("sha256=")).toBe(true);
  });

  it("uses custom prefix", () => {
    const header = buildSignatureHeader(BODY, {
      secret: SECRET,
      prefix: "v0=",
      algorithm: "sha256",
    });
    expect(header.startsWith("v0=")).toBe(true);
  });
});

describe("verifySignature", () => {
  it("returns true for a valid signature", () => {
    const sig = buildSignatureHeader(BODY, { secret: SECRET });
    expect(verifySignature(BODY, sig, { secret: SECRET })).toBe(true);
  });

  it("returns false for a tampered body", () => {
    const sig = buildSignatureHeader(BODY, { secret: SECRET });
    expect(verifySignature(Buffer.from("tampered"), sig, { secret: SECRET })).toBe(false);
  });

  it("returns false for wrong secret", () => {
    const sig = buildSignatureHeader(BODY, { secret: SECRET });
    expect(verifySignature(BODY, sig, { secret: "wrong" })).toBe(false);
  });

  it("returns false for mismatched lengths", () => {
    expect(verifySignature(BODY, "sha256=abc", { secret: SECRET })).toBe(false);
  });
});

describe("extractSignature", () => {
  it("extracts a string header", () => {
    const headers = { "x-hub-signature-256": "sha256=abc" };
    expect(extractSignature(headers)).toBe("sha256=abc");
  });

  it("extracts first value from array header", () => {
    const headers = { "x-hub-signature-256": ["sha256=abc", "sha256=def"] };
    expect(extractSignature(headers)).toBe("sha256=abc");
  });

  it("returns undefined when header is missing", () => {
    expect(extractSignature({})).toBeUndefined();
  });

  it("uses custom header name", () => {
    const headers = { "x-signature": "sha256=xyz" };
    expect(extractSignature(headers, "x-signature")).toBe("sha256=xyz");
  });
});
