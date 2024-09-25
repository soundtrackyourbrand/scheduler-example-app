export type ZoneRule = {
  id: number;
  zoneId: string;
  accountId: string;
};

export type Run = {
  id: number;
  createdAt: Date;
  actions: RuleAction[];
};

export type RepeatPart = "day" | "hour" | "minute";
export const repeatParts: RepeatPart[] = ["day", "hour", "minute"];

export function toRepeatPart(
  v: string | null,
  safe: boolean = true,
): RepeatPart | null {
  if (v === null) return null;
  const found = repeatParts.find((r) => r.toString() === v);
  if (!found && !safe) {
    throw new Error("Invalid `RepeatPart`: " + v);
  }
  return found ?? null;
}

export type Rule = {
  id: number;
  name: string;
  description: string | null;
  at: Date | null;
  nextRun: Date | null;
  repeat: number | null;
  repeatPart: RepeatPart | null;
  disabledAt: Date | null;
  assign: string | null;
  zones: ZoneRule[];

  createdAt: Date;
  updatedAt: Date;
};

export type RuleAction = {
  ruleId: number;
  runId: number;
  accountId: string;
  zoneId: string;
  action: string;
  data: string;
  status: string;
  error: string | null;

  createdAt: Date;
  updatedAt: Date;
};

export type Account = {
  id: string;
  businessName: string;
};

export type Zone = {
  id: string;
  name: string;
  location: Location;
  account: { id: string };
};

export type AccountZone = Zone & { account: Account };

export type AccountZoneMap = { [keyof: string]: AccountZone };

export type Location = {
  id: string;
  name: string;
};

export type Assignable = {
  kind: string;
  id: string;
  name: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AccountLibrary = {
  playlists: Assignable[];
  schedules: Assignable[];
};
