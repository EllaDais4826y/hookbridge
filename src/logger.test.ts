import { createLogger, LogEntry, LogLevel } from "./logger";
import { Writable } from "stream";

function captureLogger(level?: LogLevel): { logger: ReturnType<typeof createLogger>; entries: LogEntry[] } {
  const entries: LogEntry[] = [];
  const stream = new Writable({
    write(chunk, _enc, cb) {
      entries.push(JSON.parse(chunk.toString()));
      cb();
    },
  });
  const logger = createLogger({ level, stream });
  return { logger, entries };
}

describe("createLogger", () => {
  it("writes an info entry with timestamp and message", () => {
    const { logger, entries } = captureLogger();
    logger.info("hello world");
    expect(entries).toHaveLength(1);
    expect(entries[0].level).toBe("info");
    expect(entries[0].message).toBe("hello world");
    expect(typeof entries[0].timestamp).toBe("string");
  });

  it("includes optional data field when provided", () => {
    const { logger, entries } = captureLogger();
    logger.warn("something happened", { code: 42 });
    expect(entries[0].data).toEqual({ code: 42 });
  });

  it("omits data field when not provided", () => {
    const { logger, entries } = captureLogger();
    logger.info("no data");
    expect(entries[0]).not.toHaveProperty("data");
  });

  it("filters out entries below the configured level", () => {
    const { logger, entries } = captureLogger("warn");
    logger.debug("ignored");
    logger.info("also ignored");
    logger.warn("visible");
    logger.error("also visible");
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.level)).toEqual(["warn", "error"]);
  });

  it("logs all levels when level is debug", () => {
    const { logger, entries } = captureLogger("debug");
    logger.debug("d");
    logger.info("i");
    logger.warn("w");
    logger.error("e");
    expect(entries).toHaveLength(4);
  });

  it("writes valid JSON lines", () => {
    const { logger, entries } = captureLogger();
    logger.error("boom", { reason: "test" });
    expect(() => JSON.stringify(entries[0])).not.toThrow();
  });
});
