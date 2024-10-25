import "./lib/env.js";
import { getLogger } from "./lib/logger/index.js";
import { createRequestHandler } from "@remix-run/express";
import type { ServerBuild } from "@remix-run/node";
import express from "express";
import pinoHttp from "pino-http";

import { sync } from "./lib/db/index.js";
import worker from "./lib/worker/index.js";
import apiRouter from "./api/index.js";

const logger = getLogger("server");

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
