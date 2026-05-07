/**
 * IP allowlist/denylist filter middleware.
 * Supports CIDR notation and exact IP matching.
 */

export interface IpFilterConfig {
  allowlist?: string[];
  denylist?: string[];
}

function ipToInt(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0) >>> 0;
}

function matchesCidr(ip: string, cidr: string): boolean {
  if (!cidr.includes("/")) {
    return ip === cidr;
  }
  const [base, prefixStr] = cidr.split("/");
  const prefix = parseInt(prefixStr, 10);
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return (ipToInt(ip) & mask) === (ipToInt(base) & mask);
}

export function isIpAllowed(ip: string, config: IpFilterConfig): boolean {
  const { allowlist, denylist } = config;

  if (denylist && denylist.length > 0) {
    if (denylist.some((entry) => matchesCidr(ip, entry))) {
      return false;
    }
  }

  if (allowlist && allowlist.length > 0) {
    return allowlist.some((entry) => matchesCidr(ip, entry));
  }

  return true;
}

export function createIpFilterMiddleware(
  config: IpFilterConfig
): (req: any, res: any, next: () => void) => void {
  return function ipFilterMiddleware(req: any, res: any, next: () => void): void {
    const forwarded = req.headers?.["x-forwarded-for"];
    const ip: string =
      (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : null) ??
      req.socket?.remoteAddress ??
      "";

    if (!isIpAllowed(ip, config)) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Forbidden", ip }));
      return;
    }

    next();
  };
}
