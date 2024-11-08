import { Model, Op } from "sequelize";

import {
  Action,
  getNextRun,
  RepeatPart,
  Event,
  Run,
  ZoneEvent,
} from "../db/index.js";
import { Api } from "../soundtrack-api/index.js";
import { getLogger } from "../logger/index.js";
import tokenSource from "lib/token/index.js";

const logger = getLogger("lib/worker/index");

type WorkerOptions = {
  interval: number;
};

const api = new Api({ tokenSource });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeEvent(runId: number, event: Model<any, any>) {
  const eventId = event.get("id");
  if (!eventId || typeof eventId !== "number") {
    logger.info(`No event id, skipping event ${eventId}`);
    return;
  }
  const playFromId = event.get("assign");
  if (!playFromId || typeof playFromId !== "string") {
    logger.info(`Nothing to assign, skipping event ${eventId}`);
    return;
  }

  logger.info(`Executing event ${eventId}`);

  const zones = await ZoneEvent.findAll({
    where: {
      EventId: event.get("id"),
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
      error = "" + e;
    }

    await Action.create({
      EventId: eventId,
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

  const events = await Event.findAll({
    where: {
      nextRun: {
        [Op.lt]: new Date(),
      },
      disabledAt: null,
    },
  });

  if (events.length === 0) {
    logger.info("No events need action");
    return;
  }

  for (const event of events) {
    const eventId = event.get("id");
    await executeEvent(runId, event);

    const repeat = event.get("repeat") as number | null;
    const repeatPart = event.get("repeatPart") as RepeatPart | null;
    logger.info(`Event is set to repeat every ${repeat} ${repeatPart}`);

    if (repeat && repeatPart) {
      const currentRun = event.get("at") as Date | null;
      const nextRun = getNextRun(currentRun, repeat, repeatPart);
      if (nextRun) {
        logger.info(`Setting nextRun for event ${eventId} to ${nextRun}`);
        await event.update({ nextRun });
      } else {
        logger.error(`Failed to compute \`nextRun\` for event ${eventId}`);
      }
    } else {
      logger.info(`Unsetting nextRun for event ${event.get("id")}`);
      await event.update({ nextRun: null });
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
