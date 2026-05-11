import {
  addTagRule,
  removeTagRule,
  getTagRule,
  listTagRules,
  clearTagRules,
  resolveTagsForHeaders,
  tagsMatchFilter,
} from "./webhookTagging";

beforeEach(() => {
  clearTagRules();
});

describe("tag rule management", () => {
  it("adds and retrieves a rule", () => {
    addTagRule({ id: "r1", headerKey: "X-Source", headerValue: "github", tags: ["vcs", "github"] });
    const rule = getTagRule("r1");
    expect(rule).toBeDefined();
    expect(rule?.tags).toEqual(["vcs", "github"]);
  });

  it("lists all rules", () => {
    addTagRule({ id: "r1", headerKey: "X-Source", headerValue: "github", tags: ["vcs"] });
    addTagRule({ id: "r2", headerKey: "X-Source", headerValue: "gitlab", tags: ["vcs"] });
    expect(listTagRules()).toHaveLength(2);
  });

  it("removes a rule", () => {
    addTagRule({ id: "r1", headerKey: "X-Source", headerValue: "github", tags: ["vcs"] });
    expect(removeTagRule("r1")).toBe(true);
    expect(getTagRule("r1")).toBeUndefined();
  });

  it("returns false when removing nonexistent rule", () => {
    expect(removeTagRule("nope")).toBe(false);
  });

  it("clears all rules", () => {
    addTagRule({ id: "r1", headerKey: "X-Source", headerValue: "github", tags: ["vcs"] });
    clearTagRules();
    expect(listTagRules()).toHaveLength(0);
  });
});

describe("resolveTagsForHeaders", () => {
  it("resolves matching tags from headers", () => {
    addTagRule({ id: "r1", headerKey: "X-Source", headerValue: "github", tags: ["vcs", "github"] });
    const tags = resolveTagsForHeaders({ "x-source": "github" });
    expect(tags).toContain("vcs");
    expect(tags).toContain("github");
  });

  it("returns empty array when no rules match", () => {
    addTagRule({ id: "r1", headerKey: "X-Source", headerValue: "github", tags: ["vcs"] });
    const tags = resolveTagsForHeaders({ "x-source": "bitbucket" });
    expect(tags).toHaveLength(0);
  });

  it("deduplicates tags from multiple matching rules", () => {
    addTagRule({ id: "r1", headerKey: "X-Source", headerValue: "github", tags: ["vcs"] });
    addTagRule({ id: "r2", headerKey: "X-Env", headerValue: "prod", tags: ["vcs", "production"] });
    const tags = resolveTagsForHeaders({ "x-source": "github", "x-env": "prod" });
    expect(tags.filter((t) => t === "vcs")).toHaveLength(1);
    expect(tags).toContain("production");
  });
});

describe("tagsMatchFilter", () => {
  it("returns true when all required tags are present", () => {
    expect(tagsMatchFilter(["vcs", "github", "production"], ["vcs", "production"])).toBe(true);
  });

  it("returns false when a required tag is missing", () => {
    expect(tagsMatchFilter(["vcs"], ["vcs", "production"])).toBe(false);
  });

  it("returns true when required list is empty", () => {
    expect(tagsMatchFilter([], [])).toBe(true);
  });
});
