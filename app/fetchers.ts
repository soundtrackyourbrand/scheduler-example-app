/* eslint-disable @typescript-eslint/no-explicit-any */

import { Fetcher } from "swr";
import {
  Account,
  AccountLibrary,
  Assignable,
  Rule,
  RuleAction,
  Run,
  toRepeatPart,
  Zone,
} from "./types";

function dateOrNull(date: any): Date | null {
  return date ? new Date(date) : null;
}

export function toRule(data: any): any {
  return {
    ...data,
    at: dateOrNull(data.at),
    nextRun: dateOrNull(data.nextRun),
    repeatPart: toRepeatPart(data.repeatPart),
    disabledAt: dateOrNull(data.disabledAt),
    createdAt: dateOrNull(data.createdAt),
    updatedAt: dateOrNull(data.updatedAt),
  };
}

function toRuleAction(data: any): any {
  return {
    ...data,
    ruleId: data.RuleId,
    runId: data.RunId,
    createdAt: dateOrNull(data.createdAt),
    updatedAt: dateOrNull(data.updatedAt),
  };
}

function toRun(data: any): any {
  return {
    ...data,
    createdAt: dateOrNull(data.createdAt),
    actions: data.actions.map(toRuleAction),
  };
}

function toAssignable(data: any): any {
  return {
    ...data,
    createdAt: dateOrNull(data.createdAt),
    updatedAt: dateOrNull(data.updatedAt),
  };
}

function toLibrary(data: any): any {
  return {
    playlists: data.playlists.map(toAssignable),
    schedules: data.schedules.map(toAssignable),
  };
}

const defaultFetcher = (url: string) => fetch(url).then((res) => res.json());

export const ruleFetcher: Fetcher<Rule, string> = (url) =>
  defaultFetcher(url).then(toRule);
export const rulesFetcher: Fetcher<Rule[], string> = (url) =>
  defaultFetcher(url).then((rules) => rules.map(toRule));
export const runsFetcher: Fetcher<Run[], string> = (url) =>
  defaultFetcher(url).then((rules) => rules.map(toRun));
export const actionsFetcher: Fetcher<RuleAction[], string> = (url) =>
  defaultFetcher(url).then((actions) => actions.map(toRuleAction));

export const accountsFetcher: Fetcher<Account[], string> = defaultFetcher;
export const zonesFetcher: Fetcher<Zone[], string> = (url) =>
  defaultFetcher(url);
export const accountLibraryFetcher: Fetcher<AccountLibrary, string> = (url) =>
  defaultFetcher(url).then(toLibrary);
export const assignableFetcher: Fetcher<Assignable, string> = (url) =>
  defaultFetcher(url).then(toAssignable);

export const errorHandler = async (res: Response) => {
  if (!res.ok) {
    const data = await res.json();
    throw new Error(
      "Request failed with HTTP status " + res.status + ", " + data.message,
    );
  }
  return res;
};
