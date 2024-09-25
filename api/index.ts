import { Router } from "express";
import bodyParser from "body-parser";
import { inspect } from "util";
import pino from "pino";

import { Api } from "../lib/soundtrack-api/index.js";
import {
  Action,
  getNextRun,
  RepeatPart,
  repeatParts,
  Rule,
  Run,
  ZoneRule,
} from "../lib/db/index.js";
import { Model } from "sequelize";

const logger = pino();

const jsonParser = bodyParser.json();

const router = Router();
router.use(jsonParser);

router.get("/rules", async (req, res) => {
  const rules = await Rule.findAll({
    include: [{ model: ZoneRule, as: "zones" }],
  });
  res.json(rules);
});

router.post("/rules", async (req, res) => {
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

  const r = await Rule.create({
    name: req.body.name,
    description: req.body.description || null,
    at,
    nextRun,
    repeat,
    repeatPart,
    assign: req.body.assign || null,
  });
  res.json(r);
});

router.delete("/rules/:ruleId", async (req, res) => {
  await Rule.destroy({
    where: {
      id: req.params.ruleId,
    },
  });
  res.sendStatus(200);
});

router.post("/rules/:ruleId/copy", async (req, res) => {
  const r = await Rule.findByPk(parseInt(req.params.ruleId), {
    include: [{ model: ZoneRule, as: "zones" }],
  });
  if (!r) {
    res.sendStatus(404);
    return;
  }

  logger.info("Making a copy of rule " + r.get("id"));

  const copy = await Rule.create({
    name: "Copy of " + r.get("name"),
    description: r.get("description"),
    at: r.get("at"),
    nextRun: r.get("nextRun"),
    repeat: r.get("repeat"),
    repeatPart: r.get("repeatPart"),
    assign: r.get("assign"),
    disabledAt: r.get("disabledAt"),
  });

  logger.info("Created rule " + copy.get("id"));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const zoneRuleData = (r.get("zones") as Model<any, any>[]).map((zoneRule) => {
    return {
      RuleId: copy.get("id"),
      zoneId: zoneRule.get("zoneId"),
      accountId: zoneRule.get("accountId"),
      disabledAt: zoneRule.get("disabledAt"),
    };
  });

  if (zoneRuleData.length > 0) {
    logger.info(`Adding ${zoneRuleData.length} ZoneRules to ${copy.get("id")}`);
    await ZoneRule.bulkCreate(zoneRuleData);
  }

  res.send(copy);
});

router.put("/rules/:ruleId", async (req, res) => {
  const r = await Rule.findByPk(parseInt(req.params.ruleId));
  if (!r) {
    res.sendStatus(404);
    return;
  }
  if (req.body.name === "") {
    res.status(400).json({ message: "`name` cannot be empty" });
    return;
  } else if (req.body.name) {
    r.set("name", req.body.name.toString());
  }

  if (req.body.description) {
    r.set("description", req.body.description);
  } else if (req.body.description === null) {
    r.set("description", null);
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
    r.set("repeat", req.body.repeat);
    r.set("repeatPart", req.body.repeatPart);
  } else if (req.body.repeat === null) {
    r.set("repeat", null);
    r.set("repeatPart", null);
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
      r.get("repeat") as number | null,
      r.get("repeatPart") as RepeatPart | null,
      now,
    );
    r.set("at", at);
    r.set("nextRun", nextRun);
  } else if (req.body.at === null) {
    r.set("at", null);
    r.set("nextRun", null);
  }

  if (req.body.assign) {
    r.set("assign", req.body.assign);
  } else if (req.body.assign === null) {
    r.set("assign", null);
  }

  if (req.body.disabledAt) {
    const timestamp = Date.parse(req.body.disabledAt);
    if (isNaN(timestamp)) {
      res.status(400).json({ message: "Failed to parse `disabledAt`" });
      return;
    }
    r.set("disabledAt", new Date(timestamp));
  } else if (req.body.disabledAt === null) {
    r.set("disabledAt", null);
  }

  if (!r.changed()) {
    logger.info("Nothing changed");
    res.json(r);
    return;
  }
  const saved = await r.save();
  res.json(saved);
});

router.get("/rules/:ruleId/zones", async (req, res) => {
  const ruleId = parseInt(req.params.ruleId);
  const r = await Rule.findByPk(ruleId);
  if (!r) {
    res.sendStatus(404);
    return;
  }

  const zones = await ZoneRule.findAll({ where: { RuleId: ruleId } });
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
 * Adds zones to this rule
 *
 * `req.body` must look like { "add": [{"zoneId": "...", "accountId": "..." }], "activate": [], "deactivate": [], "remove": [] }
 */
router.post("/rules/:ruleId/zones", async (req, res) => {
  const ruleId = parseInt(req.params.ruleId);
  const r = await Rule.findByPk(ruleId);
  if (!r) {
    res.sendStatus(404);
    return;
  }

  if (Array.isArray(req.body.remove)) {
    const arr = req.body.remove as { zoneId: string }[];
    const ids = arr.map((item) => item.zoneId);
    logger.info("Removing", ids);
    const rows = await ZoneRule.destroy({
      where: {
        RuleId: ruleId,
        zoneId: ids,
      },
    });
    logger.info("Removed " + rows + " rows for rule " + ruleId);
  }

  if (Array.isArray(req.body.activate)) {
    const arr = req.body.activate as { zoneId: string }[];
    const ids = arr.map((item) => item.zoneId);
    const [rows] = await ZoneRule.update(
      { disabledAt: null },
      {
        where: {
          RuleId: ruleId,
          zoneId: ids,
        },
      },
    );
    logger.info("Activated " + rows + " rows for rule " + ruleId);
  }

  if (Array.isArray(req.body.deactivate)) {
    const arr = req.body.deactivate as { zoneId: string }[];
    const ids = arr.map((item) => item.zoneId);
    const [rows] = await ZoneRule.update(
      { disabledAt: new Date() },
      {
        where: {
          RuleId: ruleId,
          zoneId: ids,
        },
      },
    );
    logger.info("Deactivated " + rows + " rows for rule " + ruleId);
  }

  if (Array.isArray(req.body.add)) {
    const arr = req.body.add as { zoneId: string; accountId: string }[];
    for (const item of arr) {
      try {
        await ZoneRule.create({ ...item, RuleId: ruleId });
      } catch (e) {
        res.status(500).json({
          message: "Failed to create rule: " + inspect(item) + ", error: " + e,
        });
        return;
      }
    }
    logger.info("Added " + arr.length + " rows for rule " + ruleId);
  }

  const zoneRules = await ZoneRule.findAll({ where: { RuleId: ruleId } });
  res.json(zoneRules);
});

router.get("/rules/:ruleId", async (req, res) => {
  const r = await Rule.findByPk(parseInt(req.params.ruleId), {
    include: [{ model: ZoneRule, as: "zones" }],
  });
  if (!r) {
    res.sendStatus(404);
    return;
  }
  res.json(r);
});

router.get("/rules/:ruleId/actions", async (req, res) => {
  const r = await Rule.findByPk(parseInt(req.params.ruleId), {
    include: [{ model: Action, as: "actions" }],
  });
  if (!r) {
    res.sendStatus(404);
    return;
  }
  res.json(r.get("actions"));
});

const soundtracApi = new Api();

router.get("/zones/:zoneId", async (req, res) => {
  const zone = await soundtracApi.getZone(req.params.zoneId);
  res.json(zone);
});

router.get("/zones", async (req, res) => {
  const zones = await soundtracApi.getZones();
  res.json(zones);
});

router.get("/accounts/:accountId/library", async (req, res) => {
  const library = await soundtracApi.getLibrary(req.params.accountId);
  res.json(library);
});

router.get("/accounts/:accountId/zones", async (req, res) => {
  const zones = await soundtracApi.getAccountZones(req.params.accountId);
  res.json(zones);
});

router.get("/accounts/:accountId/rules", async (req, res) => {
  const zones = await ZoneRule.findAll({
    where: { accountId: req.params.accountId },
  });
  const ruleIds = new Set<number>();
  for (const zone of zones) {
    ruleIds.add(zone.get("RuleId") as number);
  }
  const rules = await Rule.findAll({
    where: { id: Array.from(ruleIds) },
    include: [{ model: ZoneRule, as: "zones" }],
  });
  res.json(rules);
});

router.get("/accounts/:accountId", async (req, res) => {
  const account = await soundtracApi.getAccount(req.params.accountId);
  res.json(account);
});

router.get("/accounts", async (req, res) => {
  const accounts = await soundtracApi.getAccounts();
  res.json(accounts);
});

router.get("/assignable/:id", async (req, res) => {
  const assignable = await soundtracApi.getAssignable(req.params.id);
  if (assignable) {
    res.json(assignable);
  } else {
    res.status(404);
  }
});

router.all("*", (req, res) => {
  res.sendStatus(404);
});

export default router;
