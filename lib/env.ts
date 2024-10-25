import dotenv from "dotenv";
import { getLogger } from "./logger/index.js";

const logger = getLogger("lib/env");
logger.info("Starting in NODE_ENV=" + process.env.NODE_ENV);

// The dev server parses keys in non-production
if (process.env.NODE_ENV === "production") {
  const config = dotenv.config();
  logger.info(
    "Parsed .env file with keys: " + Object.keys(config.parsed ?? {}).join(","),
  );
}
