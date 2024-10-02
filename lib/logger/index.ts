import pino, { Logger } from "pino";

const level =
  process.env["LOG_LEVEL"] ??
  (process.env.NODE_ENV === "development" ? "debug" : "info");

export function getLogger(module: string): Logger {
  return pino({ level }).child({ module });
}
