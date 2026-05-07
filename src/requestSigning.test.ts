import {
  generateNonce,
  buildSigningPayload,
  signRequest,
  verifyRequestSignature,
  SignedRequest,
} from "./requestSigning";

const SECRET = "test-secret-key";
const OPTIONS = { secret: SECRET };

describe("generateNonce", () => {
  it("returns a hex string of expected length", () => {
    const nonce = generateNonce(16);
    expect(typeof nonce).toBe("string");
    expect(nonce).toHaveLength(32);
  });

  it("returns unique values each call", () => {
    expect(generateNonce()).not.toBe(generateNonce());
  });
});

describe("buildSigningPayload", () => {
  it("joins parts with newlines", () => {
    const payload = buildSigningPayload("POST", "/hook", 1000, "abc", '{"x":1}');
    expect(payload).toBe('POST\n/hook\n1000\nabc\n{"x":1}');
  });

  it("uppercases the method", () => {
    const payload = buildSigningPayload("get", "/", 0, "", "");
    expect(payload.startsWith("GET")).toBe(true);
  });
});

describe("signRequest", () => {
  it("returns timestamp, nonce, and signature", () => {
    const result = signRequest("POST", "/hook", "body", OPTIONS);
    expect(typeof result.timestamp).toBe("number");
    expect(typeof result.nonce).toBe("string");
    expect(typeof result.signature).toBe("string");
    expect(result.signature).toHaveLength(64);
  });

  it("produces different signatures for different bodies", () => {
    const a = signRequest("POST", "/hook", "body-a", OPTIONS);
    const b = signRequest("POST", "/hook", "body-b", OPTIONS);
    expect(a.signature).not.toBe(b.signature);
  });
});

describe("verifyRequestSignature", () => {
  it("returns true for a freshly signed request", () => {
    const signed = signRequest("POST", "/hook", "payload", OPTIONS);
    expect(verifyRequestSignature("POST", "/hook", "payload", signed, OPTIONS)).toBe(true);
  });

  it("returns false when signature is tampered", () => {
    const signed = signRequest("POST", "/hook", "payload", OPTIONS);
    const tampered: SignedRequest = { ...signed, signature: "bad" };
    expect(verifyRequestSignature("POST", "/hook", "payload", tampered, OPTIONS)).toBe(false);
  });

  it("returns false when body is different", () => {
    const signed = signRequest("POST", "/hook", "original", OPTIONS);
    expect(verifyRequestSignature("POST", "/hook", "modified", signed, OPTIONS)).toBe(false);
  });

  it("returns false when timestamp is too old", () => {
    const signed = signRequest("POST", "/hook", "payload", OPTIONS);
    const old: SignedRequest = { ...signed, timestamp: Date.now() - 10 * 60 * 1000 };
    expect(verifyRequestSignature("POST", "/hook", "payload", old, OPTIONS)).toBe(false);
  });

  it("respects custom toleranceMs", () => {
    const signed = signRequest("POST", "/hook", "payload", OPTIONS);
    const opts = { ...OPTIONS, toleranceMs: 1 };
    // Immediately verify — might still fail due to timing; use a fixed timestamp
    const fixed: SignedRequest = { ...signed, timestamp: Date.now() - 2 };
    expect(verifyRequestSignature("POST", "/hook", "payload", fixed, opts)).toBe(false);
  });
});
