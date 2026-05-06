import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { loadConfig, HookbridgeConfig } from "./config";

function writeTempConfig(obj: unknown): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hookbridge-"));
  const file = path.join(dir, "hookbridge.json");
  fs.writeFileSync(file, JSON.stringify(obj), "utf-8");
  return file;
}

describe("loadConfig", () => {
  it("returns default config when file does not exist", () => {
    const config = loadConfig("/nonexistent/path/hookbridge.json");
    expect(config.port).toBe(3000);
    expect(config.path).toBe("/webhook");
    expect(config.endpoints).toEqual([]);
    expect(config.retry.maxAttempts).toBe(5);
  });

  it("merges file values over defaults", () => {
    const file = writeTempConfig({
      port: 8080,
      endpoints: [{ url: "https://example.com/hook" }],
    });
    const config = loadConfig(file);
    expect(config.port).toBe(8080);
    expect(config.path).toBe("/webhook");
    expect(config.endpoints).toHaveLength(1);
    expect(config.retry.maxAttempts).toBe(5);
  });

  it("merges partial retry config", () => {
    const file = writeTempConfig({
      endpoints: [{ url: "https://a.example.com" }],
      retry: { maxAttempts: 10 },
    });
    const config = loadConfig(file);
    expect(config.retry.maxAttempts).toBe(10);
    expect(config.retry.initialDelayMs).toBe(200);
    expect(config.retry.backoffFactor).toBe(2);
  });

  it("throws when endpoints array is missing", () => {
    const file = writeTempConfig({ port: 3000 });
    expect(() => loadConfig(file)).toThrow(/at least one endpoint/);
  });

  it("throws when an endpoint has no url", () => {
    const file = writeTempConfig({ endpoints: [{ secret: "abc" }] });
    expect(() => loadConfig(file)).toThrow(/valid 'url'/);
  });

  it("throws on invalid JSON", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hookbridge-"));
    const file = path.join(dir, "hookbridge.json");
    fs.writeFileSync(file, "{ not valid json ", "utf-8");
    expect(() => loadConfig(file)).toThrow(/Failed to parse/);
  });

  it("supports endpoint-level timeout and secret", () => {
    const file = writeTempConfig({
      endpoints: [{ url: "https://b.example.com", secret: "s3cr3t", timeoutMs: 5000 }],
    });
    const config = loadConfig(file);
    expect(config.endpoints[0].secret).toBe("s3cr3t");
    expect(config.endpoints[0].timeoutMs).toBe(5000);
  });
});
