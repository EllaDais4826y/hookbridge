import { IncomingMessage, ServerResponse } from "http";
import { muteTarget, unmuteTarget, isMuted, listMuted, getMuteEntry, clearMuted } from "./webhookMute";
import { webhookMuteHandler } from "./webhookMuteHandler";

export function isMuteRoute(req: IncomingMessage): boolean {
  const url = req.url ?? "";
  return url.startsWith("/admin/mute");
}

export async function tryMuteRoute(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  if (!isMuteRoute(req)) return false;
  await webhookMuteHandler(req, res);
  return true;
}

export function checkEndpointMuted(target: string): boolean {
  return isMuted(target);
}
