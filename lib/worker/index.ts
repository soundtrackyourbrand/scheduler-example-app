import { Model, Op } from "sequelize";
import pino from "pino";

import {
  Action,
  getNextRun,
  RepeatPart,
  Rule,
  Run,
  ZoneRule,
} from "../db/index.js";
import { Api } from "../soundtrack-api/index.js";

const logger = pino();

type WorkerOptions = {
  interval: number;
};

const api = new Api();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeRule(runId: number, rule: Model<any, any>) {
  const ruleId = rule.get("id");
  if (!ruleId || typeof ruleId !== "number") {
    logger.info(`No rule id, skipping rule ${ruleId}`);
    return;
  }
  const playFromId = rule.get("assign");
  if (!playFromId || typeof playFromId !== "string") {
    logger.info(`Nothing to assign, skipping rule ${ruleId}`);
    return;
  }

  logger.info(`Executing rule ${ruleId}`);

  const zones = await ZoneRule.findAll({
    where: {
      RuleId: rule.get("id"),
      disabledAt: null,
    },
  });

  logger.info(`Found ${zones.length} zones`);

  for (const zone of zones) {
    const zoneId = zone.get("zoneId");
    if (!zoneId || typeof zoneId !== "string") {
      logger.info("No zone id");
      continue;
    }

    logger.info(`Assigning ${playFromId} to ${zoneId}`);

    let status: "success" | "error" = "success";
    let error: unknown | null = null;

    try {
      await api.assignMusic(zoneId, playFromId);
    } catch (e) {
      logger.info(`Failed to assign music to ${zoneId}: ${e}`);
      status = "error";
      error = e;
    }

    await Action.create({
      RuleId: ruleId,
      RunId: runId,
      zoneId: zone.get("zoneId"),
      accountId: zone.get("accountId"),

      action: "assign",
      data: JSON.stringify({ playFromId }),
      status,
      error,
    });
  }
}

async function run() {
  const r = await Run.create();
  const runId = r.get("id") as number;

  logger.info(`Created run ${runId}`);

  const rules = await Rule.findAll({
    where: {
      nextRun: {
        [Op.lt]: new Date(),
      },
      disabledAt: null,
    },
  });

  if (rules.length === 0) {
    logger.info("No rules need action");
    return;
  }

  for (const rule of rules) {
    const ruleId = rule.get("id");
    await executeRule(runId, rule);

    const repeat = rule.get("repeat") as number | null;
    const repeatPart = rule.get("repeatPart") as RepeatPart | null;
    logger.info(`Rule is set to repeat every ${repeat} ${repeatPart}`);

    if (repeat && repeatPart) {
      const currentRun = rule.get("at") as Date | null;
      const nextRun = getNextRun(currentRun, repeat, repeatPart);
      if (nextRun) {
        logger.info(`Setting nextRun for rule ${ruleId} to ${nextRun}`);
        await rule.update({ nextRun });
      } else {
        logger.error(`Failed to compute \`nextRun\` for rule ${ruleId}`);
      }
    } else {
      logger.info(`Unsetting nextRun for rule ${rule.get("id")}`);
      await rule.update({ nextRun: null });
    }
  }
}

let currentTimeout: NodeJS.Timeout | null = null;
const numberFormatter = Intl.NumberFormat();

export default {
  start(options: WorkerOptions) {
    const interval = !isNaN(options.interval) ? options.interval : 60;
    if (!interval || interval < 0) {
      throw new Error(
        "Invalid worker interval: " + interval + ", must be > 0.",
      );
    }
    logger.info("Starting worker at interval " + interval + " seconds");
    async function _run() {
      const start = new Date().getTime();
      try {
        await run();
      } catch (e) {
        logger.error("Run failed: " + e);
      }
      const took = new Date().getTime() - start;
      logger.info(`Done checking, took ${numberFormatter.format(took)} ms`);
      currentTimeout = setTimeout(_run, interval * 1000);
    }
    _run();
  },
  stop() {
    if (currentTimeout) {
      logger.info("Stopping woker ...");
      clearInterval(currentTimeout);
    }
  },
};
