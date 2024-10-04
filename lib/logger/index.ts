import pino, { Logger } from "pino";

const logger = pino({
  level:
    process.env["LOG_LEVEL"] ??
    (process.env.NODE_ENV === "development" ? "debug" : "info"),
  formatters: {
    level(level) {
      return { level };
    },
  },
});

export function getLogger(module: string): Logger {
  return logger.child({ module });
}
