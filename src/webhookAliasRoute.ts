import type { IncomingMessage, ServerResponse } from "http";
import { webhookAliasHandler } from "./webhookAliasHandler";
import { resolveAlias } from "./webhookAlias";

const ALIAS_ADMIN_PATH = "/_/aliases";
const ALIAS_RESOLVE_PREFIX = "/_/a/";

export function isAliasRoute(req: IncomingMessage): boolean {
  const url = req.url ?? "/";
  return (
    url === ALIAS_ADMIN_PATH ||
    url.startsWith(ALIAS_ADMIN_PATH + "?") ||
    url.startsWith(ALIAS_RESOLVE_PREFIX)
  );
}

export async function tryAliasRoute(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = req.url ?? "/";

  // Admin CRUD endpoint
  if (url === ALIAS_ADMIN_PATH || url.startsWith(ALIAS_ADMIN_PATH + "?")) {
    await webhookAliasHandler(req, res);
    return true;
  }

  // Resolve short alias and rewrite URL
  if (url.startsWith(ALIAS_RESOLVE_PREFIX)) {
    const alias = url.slice(ALIAS_RESOLVE_PREFIX.length).split("?")[0];
    const target = resolveAlias(alias);
    if (!target) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Alias '${alias}' not found` }));
      return true;
    }
    // Rewrite request URL so downstream routing handles it normally
    req.url = target + (url.includes("?") ? "?" + url.split("?")[1] : "");
    return false; // let router continue with rewritten URL
  }

  return false;
}
