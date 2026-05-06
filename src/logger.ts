import { createWriteStream, WriteStream } from "fs";

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
}

export interface Logger {
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
  debug(message: string, data?: Record<string, unknown>): void;
}

function formatEntry(level: LogLevel, message: string, data?: Record<string, unknown>): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(data !== undefined ? { data } : {}),
  };
}

export function createLogger(options: { level?: LogLevel; stream?: NodeJS.WritableStream } = {}): Logger {
  const { level = "info", stream = process.stdout } = options;

  const levels: LogLevel[] = ["debug", "info", "warn", "error"];
  const minLevel = levels.indexOf(level);

  function write(entry: LogEntry): void {
    if (levels.indexOf(entry.level) >= minLevel) {
      stream.write(JSON.stringify(entry) + "\n");
    }
  }

  return {
    info(message, data) {
      write(formatEntry("info", message, data));
    },
    warn(message, data) {
      write(formatEntry("warn", message, data));
    },
    error(message, data) {
      write(formatEntry("error", message, data));
    },
    debug(message, data) {
      write(formatEntry("debug", message, data));
    },
  };
}

export const defaultLogger: Logger = createLogger();
