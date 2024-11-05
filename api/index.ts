import { Router } from "express";
import bodyParser from "body-parser";
import { inspect } from "util";

import { Api } from "../lib/soundtrack-api/index.js";
import {
  Action,
  getNextRun,
  RepeatPart,
  repeatParts,
  Event,
  Run,
  ZoneEvent,
} from "../lib/db/index.js";
import { Model } from "sequelize";
import { InMemoryCache } from "../lib/cache/index.js";
import { SequelizeCache } from "../lib/db/cache.js";
import { getLogger } from "../lib/logger/index.js";

const logger = getLogger("api/index");

const jsonParser = bodyParser.json();

const router = Router();
router.use(jsonParser);

router.get("/events", async (req, res) => {
  const events = await Event.findAll({
    include: [{ model: ZoneEvent, as: "zones" }],
  });
  res.json(events);
});

router.post("/events", async (req, res) => {
  if (!req.body.name) {
    res.status(400).json({ message: "Missing `name`" });
    return;
  }
  let at: Date | null = null;
  let nextRun: Date | null = null;
  if (req.body.at) {
    const timestamp = Date.parse(req.body.at);
    if (isNaN(timestamp)) {
      res.status(400).json({ message: "Failed to parse `at`" });
      return;
    }
    at = new Date(timestamp);
    const now = new Date();
    if (at.getTime() > now.getTime()) {
      nextRun = at;
    }
  }

  let repeat: number | null = null;
  let repeatPart: RepeatPart | null = null;
  if (req.body.repeat) {
    if (typeof req.body.repeat !== "number" || req.body.repeat < 0) {
      res.status(400).json({
        message:
          "Invalid `repeat` must be a number > 0, got: " + req.body.repeat,
      });
      return;
    }
    if (!repeatParts.includes(req.body.repeatPart)) {
      res.status(400).json({
        message:
          `Invalid \`repeatPart\` must be one of ${repeatParts.join(",")}, got: ` +
          req.body.repeatPart,
      });
      return;
    }
    repeatPart = req.body.repeatPart;
    repeat = req.body.repeat;
  }

  const event = await Event.create({
    name: req.body.name,
    description: req.body.description || null,
    at,
    nextRun,
    repeat,
    repeatPart,
    assign: req.body.assign || null,
  });
  res.json(event);
});

router.delete("/events/:eventId", async (req, res) => {
  await Event.destroy({
    where: {
      id: req.params.eventId,
    },
  });
  res.sendStatus(200);
});

router.post("/events/:eventId/copy", async (req, res) => {
  const event = await Event.findByPk(parseInt(req.params.eventId), {
    include: [{ model: ZoneEvent, as: "zones" }],
  });
  if (!event) {
    res.sendStatus(404);
    return;
  }

  logger.info("Making a copy of event " + event.get("id"));

  const copy = await Event.create({
    name: "Copy of " + event.get("name"),
    description: event.get("description"),
    at: event.get("at"),
    nextRun: event.get("nextRun"),
    repeat: event.get("repeat"),
    repeatPart: event.get("repeatPart"),
    assign: event.get("assign"),
    disabledAt: event.get("disabledAt"),
  });

  logger.info("Created event " + copy.get("id"));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const zoneEventData = (event.get("zones") as Model<any, any>[]).map(
    (zoneEvent) => {
      return {
        EventId: copy.get("id"),
        zoneId: zoneEvent.get("zoneId"),
        accountId: zoneEvent.get("accountId"),
        disabledAt: zoneEvent.get("disabledAt"),
      };
    },
  );

  if (zoneEventData.length > 0) {
    logger.info(
      `Adding ${zoneEventData.length} Zoneevents to ${copy.get("id")}`,
    );
    await ZoneEvent.bulkCreate(zoneEventData);
  }

  res.send(copy);
});

router.put("/events/:eventId", async (req, res) => {
  const event = await Event.findByPk(parseInt(req.params.eventId));
  if (!event) {
    res.sendStatus(404);
    return;
  }
  if (req.body.name === "") {
    res.status(400).json({ message: "`name` cannot be empty" });
    return;
  } else if (req.body.name) {
    event.set("name", req.body.name.toString());
  }

  if (req.body.description) {
    event.set("description", req.body.description);
  } else if (req.body.description === null) {
    event.set("description", null);
  }

  if (req.body.repeat) {
    if (typeof req.body.repeat !== "number" || req.body.repeat < 0) {
      res.status(400).json({
        message:
          "Invalid `repeat` must be a number > 0, got: " + req.body.repeat,
      });
      return;
    }
    if (!repeatParts.includes(req.body.repeatPart)) {
      res.status(400).json({
        message:
          `Invalid \`repeatPart\` must be one of ${repeatParts.join(",")}, got: ` +
          req.body.repeatPart,
      });
      return;
    }
    event.set("repeat", req.body.repeat);
    event.set("repeatPart", req.body.repeatPart);
  } else if (req.body.repeat === null) {
    event.set("repeat", null);
    event.set("repeatPart", null);
  }

  if (req.body.at) {
    const timestamp = Date.parse(req.body.at);
    if (isNaN(timestamp)) {
      res.status(400).json({ message: "Failed to parse `at`" });
      return;
    }
    const at = new Date(timestamp);
    const now = new Date();
    const nextRun = getNextRun(
      at,
      event.get("repeat") as number | null,
      event.get("repeatPart") as RepeatPart | null,
      now,
    );
    event.set("at", at);
    event.set("nextRun", nextRun);
  } else if (req.body.at === null) {
    event.set("at", null);
    event.set("nextRun", null);
  }

  if (req.body.assign) {
    event.set("assign", req.body.assign);
  } else if (req.body.assign === null) {
    event.set("assign", null);
  }

  if (req.body.disabledAt) {
    const timestamp = Date.parse(req.body.disabledAt);
    if (isNaN(timestamp)) {
      res.status(400).json({ message: "Failed to parse `disabledAt`" });
      return;
    }
    event.set("disabledAt", new Date(timestamp));
  } else if (req.body.disabledAt === null) {
    event.set("disabledAt", null);
  }

  if (!event.changed()) {
    logger.info("Nothing changed");
    res.json(event);
    return;
  }
  const saved = await event.save();
  res.json(saved);
});

router.get("/events/:eventId/zones", async (req, res) => {
  const eventId = parseInt(req.params.eventId);
  const r = await Event.findByPk(eventId);
  if (!r) {
    res.sendStatus(404);
    return;
  }

  const zones = await ZoneEvent.findAll({ where: { EventId: eventId } });
  res.json(zones);
});

router.get("/runs", async (req, res) => {
  const runs = await Run.findAll({
    limit: 1000,
    order: [["createdAt", "desc"]],
    include: [{ model: Action, as: "actions" }],
  });
  res.json(runs);
});

/**
 * Adds zones to this event
 *
 * `req.body` must look like { "add": [{"zoneId": "...", "accountId": "..." }], "activate": [], "deactivate": [], "remove": [] }
 */
router.post("/events/:eventId/zones", async (req, res) => {
  const eventId = parseInt(req.params.eventId);
  const r = await Event.findByPk(eventId);
  if (!r) {
    res.sendStatus(404);
    return;
  }

  if (Array.isArray(req.body.remove)) {
    const arr = req.body.remove as { zoneId: string }[];
    const ids = arr.map((item) => item.zoneId);
    logger.info("Removing", ids);
    const rows = await ZoneEvent.destroy({
      where: {
        EventId: eventId,
        zoneId: ids,
      },
    });
    logger.info("Removed " + rows + " rows for event " + eventId);
  }

  if (Array.isArray(req.body.activate)) {
    const arr = req.body.activate as { zoneId: string }[];
    const ids = arr.map((item) => item.zoneId);
    const [rows] = await ZoneEvent.update(
      { disabledAt: null },
      {
        where: {
          EventId: eventId,
          zoneId: ids,
        },
      },
    );
    logger.info("Activated " + rows + " rows for event " + eventId);
  }

  if (Array.isArray(req.body.deactivate)) {
    const arr = req.body.deactivate as { zoneId: string }[];
    const ids = arr.map((item) => item.zoneId);
    const [rows] = await ZoneEvent.update(
      { disabledAt: new Date() },
      {
        where: {
          EventId: eventId,
          zoneId: ids,
        },
      },
    );
    logger.info("Deactivated " + rows + " rows for event " + eventId);
  }

  if (Array.isArray(req.body.add)) {
    const arr = req.body.add as { zoneId: string; accountId: string }[];
    for (const item of arr) {
      try {
        await ZoneEvent.create({ ...item, EventId: eventId });
      } catch (e) {
        res.status(500).json({
          message: "Failed to create event: " + inspect(item) + ", error: " + e,
        });
        return;
      }
    }
    logger.info("Added " + arr.length + " rows for event " + eventId);
  }

  const zoneEvents = await ZoneEvent.findAll({ where: { EventId: eventId } });
  res.json(zoneEvents);
});

router.get("/events/:eventId", async (req, res) => {
  const r = await Event.findByPk(parseInt(req.params.eventId), {
    include: [{ model: ZoneEvent, as: "zones" }],
  });
  if (!r) {
    res.sendStatus(404);
    return;
  }
  res.json(r);
});

router.get("/events/:eventId/actions", async (req, res) => {
  const r = await Event.findByPk(parseInt(req.params.eventId), {
    include: [{ model: Action, as: "actions" }],
  });
  if (!r) {
    res.sendStatus(404);
    return;
  }
  res.json(r.get("actions"));
});

const cache = process.env["DB_CACHE"]
  ? new SequelizeCache()
  : new InMemoryCache();

const soundtrackApi = new Api({ cache });

router.post("/auth/login", async (req, res) => {
  if (soundtrackApi.mode !== "user") {
    res.status(409).send("Not in user mode");
    return;
  }
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send("Missing email or password");
    return;
  }
  try {
    const loginResponse = await soundtrackApi.login(email, password);
    console.log(loginResponse);
    res.sendStatus(200);
  } catch (e) {
    logger.error("Failed to login: " + e);
    res.sendStatus(500);
  }
});

router.get("/zones/:zoneId", async (req, res) => {
  try {
    const zone = await soundtrackApi.getZone(req.params.zoneId);
    res.json(zone);
  } catch (e) {
    logger.error("Failed to get zone: " + e);
    res.sendStatus(500);
  }
});

router.get("/zones", async (req, res) => {
  try {
    const skipCache = req.query["skipCache"] === "true";
    const zones = await soundtrackApi.getZones(skipCache);
    res.json(zones);
  } catch (e) {
    logger.error("Failed to get zones: " + e);
    res.sendStatus(500);
  }
});

router.get("/accounts/:accountId/library", async (req, res) => {
  try {
    const skipCache = req.query["skipCache"] === "true";
    const library = await soundtrackApi.getLibrary(
      req.params.accountId,
      skipCache,
    );
    res.json(library);
  } catch (e) {
    logger.error("Failed to get library: " + e);
    res.sendStatus(500);
  }
});

router.get("/accounts/:accountId/zones", async (req, res) => {
  try {
    const zones = await soundtrackApi.getAccountZones(req.params.accountId);
    res.json(zones);
  } catch (e) {
    logger.error("Failed to get zones for account: " + e);
    res.sendStatus(500);
  }
});

router.get("/accounts/:accountId/events", async (req, res) => {
  const zones = await ZoneEvent.findAll({
    where: { accountId: req.params.accountId },
  });
  const eventIds = new Set<number>();
  for (const zone of zones) {
    eventIds.add(zone.get("eventId") as number);
  }
  const events = await Event.findAll({
    where: { id: Array.from(eventIds) },
    include: [{ model: ZoneEvent, as: "zones" }],
  });
  res.json(events);
});

router.get("/accounts/:accountId", async (req, res) => {
  try {
    const account = await soundtrackApi.getAccount(req.params.accountId);
    res.json(account);
  } catch (e) {
    logger.error("Failed to get account: " + e);
    res.sendStatus(500);
  }
});

router.get("/accounts", async (req, res) => {
  try {
    const skipCache = req.query["skipCache"] === "true";
    const accounts = await soundtrackApi.getAccounts(skipCache);
    res.json(accounts);
  } catch (e) {
    logger.error("Failed to get accounts: " + e);
    res.sendStatus(500);
  }
});

router.get("/assignable/:id", async (req, res) => {
  try {
    const assignable = await soundtrackApi.getAssignable(req.params.id);
    if (assignable) {
      res.json(assignable);
    } else {
      res.sendStatus(404);
    }
  } catch (e) {
    logger.error("Failed to get assignable: " + e);
    res.sendStatus(500);
  }
});

router.delete("/cache", async (req, res) => {
  logger.info("Clearing cache");
  await cache.clear();
  res.sendStatus(200);
});

router.get("/cache", async (req, res) => {
  const count = await cache.count();
  res.json({ count });
});

router.all("*", (req, res) => {
  res.sendStatus(404);
});

export default router;
