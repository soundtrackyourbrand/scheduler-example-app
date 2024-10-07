import { addDays, addHours, addMinutes } from "date-fns";
import { Sequelize, DataTypes, SyncOptions } from "sequelize";

// TODO: Initialize your database
const _sequelize = new Sequelize({
  dialect: "sqlite",
  storage: process.env.DB_STORAGE ?? "db.sqlite",
  logging: false,
});

export type RepeatPart = "day" | "hour" | "minute";
export const repeatParts: RepeatPart[] = ["day", "hour", "minute"];

// An Event represents a point in time when something will happen
export const Event = _sequelize.define("Event", {
  name: DataTypes.STRING,
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  nextRun: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  repeat: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  repeatPart: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  assign: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  disabledAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

export function getNextRun(
  at: Date | null,
  repeat: number | null,
  repeatPart: RepeatPart | null,
  now: Date = new Date(),
): Date | null {
  if (at === null) return null;
  const nowTime = now.getTime();
  if (at.getTime() > nowTime) return at;
  if (repeat === null || repeatPart === null) return null;
  let nextRun = at;
  while (nextRun.getTime() < nowTime) {
    if (repeatPart === "day") nextRun = addDays(nextRun, repeat);
    if (repeatPart === "hour") nextRun = addHours(nextRun, repeat);
    if (repeatPart === "minute") nextRun = addMinutes(nextRun, repeat);
  }
  return nextRun;
}

// A Run represents every time we check if there are events
// that we need to take an action on.
export const Run = _sequelize.define("Run", {});

// An Action represents a request made towards the Soundtrack API.
export const Action = _sequelize.define("Action", {
  accountId: DataTypes.STRING,
  zoneId: DataTypes.STRING,
  action: DataTypes.STRING,
  data: DataTypes.TEXT,
  status: DataTypes.STRING,
  error: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

export const ZoneEvent = _sequelize.define(
  "ZoneEvent",
  {
    zoneId: DataTypes.STRING,
    accountId: DataTypes.STRING,
    disabledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["EventId", "zoneId"],
      },
    ],
  },
);

export const CacheEntry = _sequelize.define("CacheEntry", {
  key: {
    type: DataTypes.STRING(1024),
    primaryKey: true,
  },
  value: DataTypes.TEXT,
});

// Relations
// =========

// Event has many zones
Event.hasMany(ZoneEvent, { onDelete: "CASCADE", as: "zones" });
ZoneEvent.belongsTo(Event);

// Event has many runs and a run can affect many events
Event.belongsToMany(Run, { through: "RunEvents" });
Run.belongsToMany(Event, { through: "RunEvents" });

// Run has many actions
Run.hasMany(Action, { onDelete: "CASCADE", as: "actions" });
Action.belongsTo(Run);

// Event also has many actions
Event.hasMany(Action, { as: "actions" });
Action.belongsTo(Event);

export async function sync(options: SyncOptions) {
  await Event.sync(options);
  await ZoneEvent.sync(options);
  await Run.sync(options);
  await Action.sync(options);
  await CacheEntry.sync(options);
}

export const sequelize = _sequelize;
