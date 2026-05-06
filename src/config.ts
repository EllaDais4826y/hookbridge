import * as fs from "fs";
import * as path from "path";

export interface EndpointConfig {
  url: string;
  secret?: string;
  timeoutMs?: number;
}

export interface HookbridgeConfig {
  port: number;
  path: string;
  endpoints: EndpointConfig[];
  retry: {
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffFactor: number;
  };
}

const DEFAULT_CONFIG: HookbridgeConfig = {
  port: 3000,
  path: "/webhook",
  endpoints: [],
  retry: {
    maxAttempts: 5,
    initialDelayMs: 200,
    maxDelayMs: 30000,
    backoffFactor: 2,
  },
};

export function loadConfig(filePath?: string): HookbridgeConfig {
  const configPath =
    filePath ||
    process.env.HOOKBRIDGE_CONFIG ||
    path.resolve(process.cwd(), "hookbridge.json");

  if (!fs.existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch (err) {
    throw new Error(`Failed to parse config file at ${configPath}: ${err}`);
  }

  if (typeof raw !== "object" || raw === null) {
    throw new Error(`Config file must export a JSON object`);
  }

  const merged: HookbridgeConfig = {
    ...DEFAULT_CONFIG,
    ...(raw as Partial<HookbridgeConfig>),
    retry: {
      ...DEFAULT_CONFIG.retry,
      ...((raw as Partial<HookbridgeConfig>).retry ?? {}),
    },
  };

  if (!Array.isArray(merged.endpoints) || merged.endpoints.length === 0) {
    throw new Error(`Config must include at least one endpoint`);
  }

  for (const ep of merged.endpoints) {
    if (!ep.url || typeof ep.url !== "string") {
      throw new Error(`Each endpoint must have a valid 'url' string`);
    }
  }

  return merged;
}
