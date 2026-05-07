import { describe, it, expect } from "vitest";
import {
  applyTransforms,
  jsonWrapTransform,
  addHeaderFieldTransform,
  createTransformMiddleware,
  TransformFn,
} from "./transformMiddleware";
import { IncomingMessage, ServerResponse } from "http";

describe("applyTransforms", () => {
  it("returns body unchanged when no transforms", () => {
    const body = Buffer.from("hello");
    expect(applyTransforms(body, {}, [])).toEqual(body);
  });

  it("applies multiple transforms in order", () => {
    const upper: TransformFn = (b) => Buffer.from(b.toString().toUpperCase());
    const exclaim: TransformFn = (b) => Buffer.from(b.toString() + "!");
    const result = applyTransforms(Buffer.from("hi"), {}, [upper, exclaim]);
    expect(result.toString()).toBe("HI!");
  });
});

describe("jsonWrapTransform", () => {
  it("wraps JSON body under a key", () => {
    const fn = jsonWrapTransform("payload");
    const input = Buffer.from(JSON.stringify({ a: 1 }));
    const result = JSON.parse(fn(input, {}).toString());
    expect(result).toEqual({ payload: { a: 1 } });
  });

  it("throws on non-JSON input", () => {
    const fn = jsonWrapTransform("data");
    expect(() => fn(Buffer.from("not-json"), {})).toThrow();
  });
});

describe("addHeaderFieldTransform", () => {
  it("injects header value into JSON body", () => {
    const fn = addHeaderFieldTransform("source", "x-source");
    const input = Buffer.from(JSON.stringify({ event: "push" }));
    const result = JSON.parse(fn(input, { "x-source": "github" }).toString());
    expect(result.source).toBe("github");
  });

  it("returns body unchanged if header missing", () => {
    const fn = addHeaderFieldTransform("source", "x-source");
    const input = Buffer.from(JSON.stringify({ event: "push" }));
    expect(fn(input, {}).toString()).toBe(input.toString());
  });

  it("returns body unchanged on non-JSON body", () => {
    const fn = addHeaderFieldTransform("source", "x-source");
    const input = Buffer.from("plain text");
    expect(fn(input, { "x-source": "test" })).toEqual(input);
  });
});

describe("createTransformMiddleware", () => {
  it("calls next with transformed body", () => {
    const upper: TransformFn = (b) => Buffer.from(b.toString().toUpperCase());
    const middleware = createTransformMiddleware({ transforms: [upper] });
    const req = { headers: {} } as IncomingMessage;
    const res = {} as ServerResponse;
    const rawBody = Buffer.from("hello");

    let called = false;
    middleware(req, res, (err, body) => {
      called = true;
      expect(err).toBeUndefined();
      expect(body?.toString()).toBe("HELLO");
    }, rawBody);

    expect(called).toBe(true);
  });

  it("calls next with error if transform throws", () => {
    const bad: TransformFn = () => { throw new Error("boom"); };
    const middleware = createTransformMiddleware({ transforms: [bad] });
    const req = { headers: {} } as IncomingMessage;
    const res = {} as ServerResponse;

    let errCaught: Error | undefined;
    middleware(req, res, (err) => { errCaught = err; }, Buffer.from("x"));
    expect(errCaught?.message).toBe("boom");
  });
});
