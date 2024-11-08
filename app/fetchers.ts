/* eslint-disable @typescript-eslint/no-explicit-any */

import { Fetcher } from "swr";
import {
  Account,
  AccountLibrary,
  Assignable,
  AuthMode,
  CacheMetadata,
  Event,
  EventAction,
  Run,
  toRepeatPart,
  Zone,
} from "./types";

function dateOrNull(date: any): Date | null {
  return date ? new Date(date) : null;
}

export function toEvent(data: any): any {
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

function toEventAction(data: any): any {
  return {
    ...data,
    eventId: data.EventId,
    runId: data.RunId,
    createdAt: dateOrNull(data.createdAt),
    updatedAt: dateOrNull(data.updatedAt),
  };
}

function toRun(data: any): any {
  return {
    ...data,
    createdAt: dateOrNull(data.createdAt),
    actions: data.actions.map(toEventAction),
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

export const eventFetcher: Fetcher<Event, string> = (url) =>
  defaultFetcher(url).then(toEvent);
export const eventsFetcher: Fetcher<Event[], string> = (url) =>
  defaultFetcher(url).then((events) => events.map(toEvent));
export const runsFetcher: Fetcher<Run[], string> = (url) =>
  defaultFetcher(url).then((runs) => runs.map(toRun));
export const actionsFetcher: Fetcher<EventAction[], string> = (url) =>
  defaultFetcher(url).then((actions) => actions.map(toEventAction));

export const accountsFetcher: Fetcher<Account[], string> = defaultFetcher;
export const zonesFetcher: Fetcher<Zone[], string> = (url) =>
  defaultFetcher(url);
export const accountLibraryFetcher: Fetcher<AccountLibrary, string> = (url) =>
  defaultFetcher(url).then(toLibrary);
export const assignableFetcher: Fetcher<Assignable, string> = (url) =>
  defaultFetcher(url).then(toAssignable);

export const cacheFetcher: Fetcher<CacheMetadata, string> = defaultFetcher;
export const authModeFetcher: Fetcher<AuthMode, string> = defaultFetcher;

export const errorHandler = async (res: Response) => {
  if (!res.ok) {
    const data = await res.json();
    throw new Error(
      "Request failed with HTTP status " + res.status + ", " + data.message,
    );
  }
  return res;
};
