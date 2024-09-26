import React from "react";
import { Link } from "@remix-run/react";
import { PropsWithChildren, useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { accountsFetcher, eventsFetcher } from "../fetchers";
import { Button } from "~/components/ui/button";
import DateTime from "~/components/DateTime";
import { Event } from "~/types";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
} from "~/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { AssignableDisplayData } from "~/components/AssignableDisplay";
import Page from "~/components/Page";
import { MetaFunction } from "@remix-run/node";
import { pageTitle } from "~/lib/utils";
import RepeatDisplay from "~/components/RepeatDisplay";
import Paper from "~/components/Paper";

export const meta: MetaFunction = () => {
  return [{ title: pageTitle("Events") }];
};

type Deactivated = "all" | "deactivated" | "active";

type Filter = {
  accounts: string[];
  deactivated: Deactivated;
  dateRange: { startDate: Date | null; endDate: Date | null };
};

const emptyFilter: Filter = {
  accounts: [],
  deactivated: "all",
  dateRange: { startDate: null, endDate: null },
};

function filterIsEmpty(filter: Filter): boolean {
  return (
    filter.accounts.length === 0 &&
    filter.deactivated === "all" &&
    filter.dateRange.startDate === null &&
    filter.dateRange.endDate === null
  );
}

export default function Events() {
  const { data: events } = useSWR("/api/v1/events", eventsFetcher);
  const { data: accounts } = useSWR("/api/v1/accounts", accountsFetcher);
  const [filter, setFilter] = useState<Filter>(emptyFilter);

  const clearFilters = () => {
    setFilter(emptyFilter);
  };

  const handleAccountFilterChange = useCallback(
    (accountId: string, checked: boolean) => {
      setFilter((f) => {
        if (checked && !f.accounts.includes(accountId))
          return { ...f, accounts: f.accounts.concat([accountId]) };
        else
          return {
            ...f,
            accounts: f.accounts.filter((id) => id !== accountId),
          };
      });
    },
    [setFilter],
  );

  const filteredEvents = useMemo<Event[]>(() => {
    if (!events) return [];
    let _events = events.concat([]);
    if (filter.accounts.length > 0) {
      _events = _events.filter(
        (event) =>
          !!event.zones.find((zone) =>
            filter.accounts.includes(zone.accountId),
          ),
      );
    }
    if (filter.deactivated !== "all") {
      _events = _events.filter((event) =>
        filter.deactivated === "deactivated"
          ? event.disabledAt !== null
          : event.disabledAt === null,
      );
    }
    return _events;
  }, [filter, events]);

  const selectedAccounts =
    accounts?.filter((account) => filter.accounts.includes(account.id)) ?? [];
  let accountsButtonLabel = "Accounts";
  if (selectedAccounts?.length > 0)
    accountsButtonLabel = selectedAccounts[0].businessName;
  if (selectedAccounts?.length > 1)
    accountsButtonLabel += " +" + (selectedAccounts.length - 1);

  return (
    <Page breadcrumbs={[{ label: "Events" }]}>
      <Paper className="flex rounded px-2 py-2 mb-1">
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="mr-1">
                {accountsButtonLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {accounts?.map((account) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={account.id}
                    checked={filter.accounts.includes(account.id)}
                    onCheckedChange={(checked) =>
                      handleAccountFilterChange(account.id, checked)
                    }
                  >
                    {account.businessName}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Select
            value={filter.deactivated}
            onValueChange={(deactivated) =>
              setFilter((f) => ({
                ...f,
                deactivated: deactivated as Deactivated,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="deactivated">Deactivated</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-grow"></div>
        <Link to="new">
          <Button>New event</Button>
        </Link>
      </Paper>
      {!filterIsEmpty(filter) && (
        <Button size="sm" variant="ghost" onClick={clearFilters}>
          Clear filters
        </Button>
      )}
      <div className="mt-3">
        {events?.length === 0 && <EmptyMessage>No events</EmptyMessage>}
        {(events?.length ?? 0) > 0 && filteredEvents.length === 0 && (
          <EmptyMessage>No events match your filter</EmptyMessage>
        )}
        {filteredEvents.map((event) => {
          return (
            <div key={event.id} className="mb-3">
              <div className="flex">
                <div className="flex-grow">
                  <Link to={"/events/" + event.id}>
                    <h3 className="inline font-medium hover:underline">
                      {event.name}
                    </h3>
                  </Link>
                </div>
                <div>
                  {event.assign ? (
                    <AssignableDisplayData id={event.assign} size="md" link />
                  ) : (
                    <p className="text-slate-400">No music</p>
                  )}
                </div>
              </div>
              <div className="flex">
                <div className="flex-grow">
                  <DateTime className="text-slate-500" dt={event.nextRun} />
                  {event.repeat ? (
                    <>
                      , repeat{" "}
                      <RepeatDisplay
                        repeat={event.repeat}
                        repeatPart={event.repeatPart}
                      />
                    </>
                  ) : null}
                </div>
                <div>
                  <span className="text-slate-400">
                    {event.zones.length} zone
                    {event.zones.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div className="border-t border-t-slate-100 text-slate-300 mt-4 text-align-center pt-2 text-sm">
          {filteredEvents.length} of {events?.length} events
        </div>
      </div>
    </Page>
  );
}

function EmptyMessage(props: PropsWithChildren) {
  return (
    <p className="text-slate-400 border border-slate-200 text-sm text-center rounded p-3">
      {props.children}
    </p>
  );
}
