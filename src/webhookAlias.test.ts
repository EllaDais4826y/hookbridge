import {
  addAlias,
  removeAlias,
  getAlias,
  listAliases,
  clearAliases,
  resolveAlias,
} from "./webhookAlias";

beforeEach(() => {
  clearAliases();
});

describe("addAlias", () => {
  it("stores and returns the alias entry", () => {
    const entry = addAlias("my-hook", "/hooks/endpoint-1", "Primary hook");
    expect(entry.alias).toBe("my-hook");
    expect(entry.target).toBe("/hooks/endpoint-1");
    expect(entry.description).toBe("Primary hook");
    expect(entry.createdAt).toBeTruthy();
  });

  it("overwrites an existing alias", () => {
    addAlias("dup", "/old");
    addAlias("dup", "/new");
    expect(resolveAlias("dup")).toBe("/new");
  });

  it("stores alias without optional description", () => {
    const entry = addAlias("no-desc", "/hooks/no-desc");
    expect(entry.description).toBeUndefined();
  });
});

describe("getAlias", () => {
  it("returns undefined for unknown alias", () => {
    expect(getAlias("nope")).toBeUndefined();
  });

  it("returns the entry for a known alias", () => {
    addAlias("known", "/target");
    expect(getAlias("known")?.target).toBe("/target");
  });
});

describe("removeAlias", () => {
  it("returns true when alias existed", () => {
    addAlias("rem", "/x");
    expect(removeAlias("rem")).toBe(true);
    expect(getAlias("rem")).toBeUndefined();
  });

  it("returns false when alias did not exist", () => {
    expect(removeAlias("ghost")).toBe(false);
  });
});

describe("listAliases", () => {
  it("returns all stored aliases", () => {
    addAlias("a", "/1");
    addAlias("b", "/2");
    const list = listAliases();
    expect(list).toHaveLength(2);
    expect(list.map((e) => e.alias)).toEqual(expect.arrayContaining(["a", "b"]));
  });

  it("returns an empty array when no aliases are stored", () => {
    expect(listAliases()).toEqual([]);
  });
});

describe("resolveAlias", () => {
  it("resolves a registered alias", () => {
    addAlias("short", "/hooks/long-name");
    expect(resolveAlias("short")).toBe("/hooks/long-name");
  });

  it("returns undefined for unregistered alias", () => {
    expect(resolveAlias("unknown")).toBeUndefined();
  });
});
