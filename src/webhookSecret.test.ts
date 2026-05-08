import { describe, it, expect, beforeEach } from "vitest";
import {
  addSecret,
  removeSecret,
  listSecrets,
  getSecret,
  clearSecrets,
  findMatchingSecret,
  secretCount,
} from "./webhookSecret.js";

beforeEach(() => {
  clearSecrets();
});

describe("addSecret", () => {
  it("stores a secret and returns the entry", () => {
    const entry = addSecret("primary", "s3cr3t");
    expect(entry.name).toBe("primary");
    expect(entry.secret).toBe("s3cr3t");
    expect(typeof entry.createdAt).toBe("number");
  });

  it("overwrites an existing secret with the same name", () => {
    addSecret("primary", "old");
    addSecret("primary", "new");
    expect(secretCount()).toBe(1);
    expect(getSecret("primary")?.secret).toBe("new");
  });
});

describe("removeSecret", () => {
  it("returns true when secret existed", () => {
    addSecret("key", "value");
    expect(removeSecret("key")).toBe(true);
  });

  it("returns false when secret did not exist", () => {
    expect(removeSecret("missing")).toBe(false);
  });
});

describe("listSecrets", () => {
  it("returns all secrets sorted by createdAt", () => {
    addSecret("b", "2");
    addSecret("a", "1");
    const list = listSecrets();
    expect(list).toHaveLength(2);
    expect(list[0].createdAt).toBeLessThanOrEqual(list[1].createdAt);
  });
});

describe("findMatchingSecret", () => {
  it("finds a secret by value", () => {
    addSecret("main", "abc123");
    const found = findMatchingSecret("abc123");
    expect(found?.name).toBe("main");
  });

  it("returns undefined when no match", () => {
    expect(findMatchingSecret("nope")).toBeUndefined();
  });
});

describe("clearSecrets", () => {
  it("removes all secrets", () => {
    addSecret("x", "1");
    addSecret("y", "2");
    clearSecrets();
    expect(secretCount()).toBe(0);
  });
});
