import { IncomingMessage, ServerResponse } from "http";
import { replayHandler } from "./replayHandler";
import { Config } from "./config";
import { Logger } from "./logger";

const REPLAY_PATH = "/_hookbridge/replay";

export function isReplayRoute(req: IncomingMessage): boolean {
  return req.url === REPLAY_PATH || req.url?.startsWith(REPLAY_PATH + "?") === true;
}

export async function tryReplayRoute(
  req: IncomingMessage,
  res: ServerResponse,
  config: Config,
  logger: Logger
): Promise<boolean> {
  if (!isReplayRoute(req)) {
    return false;
  }
  await replayHandler(req, res, config, logger);
  return true;
}
