import { createRequestHandler } from "@remix-run/express";
import type { ServerBuild } from "@remix-run/node";
import express from "express";
import dotenv from "dotenv";
import pino from "pino";
import pinoHttp from "pino-http";

import { sync } from "./lib/db/index.js";
import worker from "./lib/worker/index.js";
import apiRouter from "./api/index.js";

const logger = pino().child({ module: "server" });
logger.info("Starting in NODE_ENV=" + process.env.NODE_ENV);

// The dev server parses keys in non-production
if (process.env.NODE_ENV === "production") {
  const config = dotenv.config();
  logger.info(
    "Parsed .env file with keys: " + Object.keys(config.parsed ?? {}).join(","),
  );
}

const app = express();
if (process.env.REQUEST_LOG) {
  app.use(pinoHttp());
}
app.disable("x-powered-by");

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? null
    : await import("vite").then((vite) =>
        vite.createServer({ server: { middlewareMode: true } }),
      );

app.use(
  viteDevServer ? viteDevServer.middlewares : express.static("build/client"),
);

const build = (
  viteDevServer
    ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
    : await import("./build/server/index.js")
) as ServerBuild | (() => Promise<ServerBuild>);

app.use("/api/v1", apiRouter);
app.get("/-/alive", (req, res) => res.sendStatus(200));
app.get("/-/ready", (req, res) => res.sendStatus(200));
app.all("*", createRequestHandler({ build }));

if (process.env.SYNC_DB) {
  logger.info("Syncing db ...");
  await sync({ force: true });
} else {
  logger.info("Not syncing db ...");
}

const port = process.env.PORT ?? 5173;
app.listen(port, () => {
  worker.start({ interval: parseInt(process.env.WORKER_INTERVAL ?? "") });
  logger.info("⚡️ Serving on http://localhost:" + port);
});
