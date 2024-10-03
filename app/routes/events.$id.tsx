import React from "react";
import { useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import {
  accountsFetcher,
  actionsFetcher,
  errorHandler,
  eventFetcher,
  toEvent,
  zonesFetcher,
} from "../fetchers";
import { useNavigate, useParams } from "@remix-run/react";
import useSWRMutation from "swr/mutation";
import DateTime from "~/components/DateTime";
import EventForm, { EventData } from "~/components/forms/EventForm";
import { Button } from "~/components/ui/button";
import Paper from "~/components/Paper";
import {
  Account,
  AccountZone,
  AccountZoneMap,
  ZoneEvent,
  Event as _Event,
} from "~/types";
import { DataTable } from "~/components/DataTable";
import {
  columns as zoneColumns,
  ZoneRow,
  ZoneRowAction,
  ZoneRowActionData,
} from "~/components/columns/zone";
import { columns as actionColumns } from "~/components/columns/action";
import { AssignableDisplayData } from "~/components/AssignableDisplay";
import Page, { PageWrap } from "~/components/Page";
import ErrorAlert from "~/components/ErrorAlert";
import { toast } from "sonner";
import { CopyIcon, Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import { MetaFunction } from "@remix-run/node";
import { pageTitle } from "~/lib/utils";
import RepeatDisplay from "~/components/RepeatDisplay";

export const meta: MetaFunction = ({ params }) => {
  return [{ title: pageTitle("Events", "#" + params.id) }];
};

async function destroyEvent(url: string): Promise<unknown> {
  return await fetch(url, { method: "DELETE" });
}

type EventUpdate = {
  name?: string;
  description?: string;
};

async function updateEvent(
  url: string,
  { arg }: { arg: EventUpdate },
): Promise<unknown> {
  return await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(arg),
  }).then(errorHandler);
}

type EventZonesUpdateItem = { zoneId: string; accountId: string };

type EventZonesUpdate = {
  add: EventZonesUpdateItem[];
  remove: EventZonesUpdateItem[];
};

async function updateEventZones(
  url: string,
  { arg }: { arg: EventZonesUpdate },
): Promise<unknown> {
  return await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(arg),
  }).then(errorHandler);
}

async function copyEvent(url: string): Promise<_Event> {
  return await fetch(url, {
    method: "POST",
  })
    .then(errorHandler)
    .then((res) => res.json())
    .then(toEvent);
}

export default function Event() {
  const params = useParams<{ id: string }>();
  const eventKey = "/api/v1/events/" + params.id;

  const [editing, setEditing] = useState<boolean>(false);
  const navigate = useNavigate();
  const { mutate } = useSWRConfig();

  const { data: event, error } = useSWR(eventKey, eventFetcher);
  const {
    data: accounts,
    error: accountsError,
    isLoading: isLoadingAccount,
  } = useSWR("/api/v1/accounts", accountsFetcher);
  const {
    data: zones,
    error: zonesError,
    isLoading: isLoadingZones,
  } = useSWR("/api/v1/zones", zonesFetcher);

  const { trigger: destroyTrigger, error: destroyError } = useSWRMutation(
    eventKey,
    destroyEvent,
  );
  const { trigger: updateTrigger, error: updateError } = useSWRMutation(
    eventKey,
    updateEvent,
  );
  const { trigger: copyTrigger, error: copyError } = useSWRMutation(
    eventKey + "/copy",
    copyEvent,
  );
  const { trigger: updateZonesTrigger, error: updateZonesError } =
    useSWRMutation(eventKey + "/zones", updateEventZones);

  const zonesWithAccount = useMemo(() => {
    if (!zones || !accounts) return null;
    const accountMap = accounts.reduce(
      (acc, account) => {
        acc[account.id] = account;
        return acc;
      },
      {} as { [keyof: string]: Account },
    );
    return zones.map((zone) => ({
      ...zone,
      account: accountMap[zone.account.id],
    }));
  }, [zones, accounts]);

  const zoneMap: AccountZoneMap | null = useMemo(() => {
    if (!zonesWithAccount) return null;
    return zonesWithAccount.reduce(
      (acc, zone) => {
        acc[zone.id] = zone;
        return acc;
      },
      {} as { [keyof: string]: AccountZone },
    );
  }, [zonesWithAccount]);

  const activeZoneEvents: ZoneEvent[] = event?.zones ?? [];
  const activeZoneIds: string[] = activeZoneEvents.map(
    (zoneEvent) => zoneEvent.zoneId,
  );

  const handleDelete = async () => {
    await destroyTrigger();
    navigate("/events");
  };

  const handleUpdate = async (data: EventData) => {
    await updateTrigger(data);
    toast("Event updated");
  };

  const handleCopy = async () => {
    const copy = await copyTrigger();
    toast("Copied event #" + copy.id + ": " + copy.name);
    navigate("/events/" + copy.id);
  };

  const handleZoneAction = async (update: EventZonesUpdate) => {
    await updateZonesTrigger(update);
    let message = "";
    if (update.add.length)
      message += `${update.add.length} zone${update.add.length === 1 ? "" : "s"} added`;
    if (update.remove.length)
      message += `${update.remove.length} zone${update.remove.length === 1 ? "" : "s"} removed`;
    if (message) {
      toast(message);
    }
    mutate(eventKey);
  };

  const handleSingleZoneAction = async (
    action: ZoneRowAction,
    data: ZoneRowActionData,
  ) => {
    const update: EventZonesUpdate = { add: [], remove: [] };
    if (action === "add") update.add.push(data);
    if (action === "remove") update.remove.push(data);
    await handleZoneAction(update);
  };

  const err = [
    error,
    accountsError,
    zonesError,
    destroyError,
    updateZonesError,
    copyError,
  ].find((err) => !!err);

  return (
    <Page
      breadcrumbs={[
        { label: "Events", to: "/events" },
        { label: event ? event.name : "..." },
      ]}
      noWrap
    >
      {event && (
        <>
          <PageWrap>
            <Paper>
              <ErrorAlert error={err} className="mb-4" />
              {editing && event && (
                <>
                  <EventForm
                    initialEvent={event}
                    onSubmit={handleUpdate}
                    onCancel={() => setEditing(false)}
                    error={updateError}
                    action="Update event"
                  />
                </>
              )}
              {!editing && (
                <div className="flex mb-4">
                  <div className="flex-grow mr-2">
                    <h1 className="text-xl font-medium">{event.name}</h1>
                    <p className="text-slate-700">{event.description}</p>
                  </div>
                  <div className="shrink-0 flex">
                    <Button
                      onClick={() => setEditing(true)}
                      size="sm"
                      className="mr-1"
                    >
                      <Pencil1Icon className="mr-2" />
                      Edit
                    </Button>
                    <Button size="sm" className="mr-1" onClick={handleCopy}>
                      <CopyIcon className="mr-2" />
                      Duplicate
                    </Button>
                    <Button
                      onClick={handleDelete}
                      variant="destructive"
                      size="sm"
                    >
                      <TrashIcon className="mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
              {!editing && (
                <div>
                  <div className="mb-4">
                    {event.assign ? (
                      <AssignableDisplayData id={event.assign} size="md" link />
                    ) : (
                      <span className="text-slate-500">Nothing to assign</span>
                    )}
                  </div>
                  <p>
                    <DateTime dt={event.nextRun} empty="Not scheduled" />
                  </p>
                  <p className="mb-1 text-sm text-slate-500">
                    Started <DateTime dt={event.at} />
                  </p>
                  <p>
                    Repeat{" "}
                    <RepeatDisplay
                      repeat={event.repeat}
                      repeatPart={event.repeatPart}
                    />
                  </p>
                </div>
              )}
            </Paper>
          </PageWrap>
          <div className="flex mt-4">
            <div className="flex-1">
              <h2 className="text-sm font-medium mb-2">Available zones</h2>
              <p className="text-sm text-slate-400">
                Zones available on your API key that are not part of this event
              </p>
              <DataTable
                pagination
                columns={zoneColumns}
                loading={isLoadingZones || isLoadingAccount}
                loadingRows={10} // Page size
                data={
                  (zonesWithAccount
                    ?.filter((zone) => !activeZoneIds.includes(zone.id))
                    .map((zone) => ({
                      zoneEvent: {
                        zoneId: zone.id,
                        accountId: zone.account.id,
                      },
                      zone,
                      action: "add",
                      onAction: handleSingleZoneAction,
                    })) as ZoneRow[]) ?? []
                }
                bulkActions={[
                  {
                    key: "add",
                    label: "Add",
                    action: async (data) => {
                      await handleZoneAction({
                        add: data.map(({ zoneEvent }) => zoneEvent),
                        remove: [],
                      });
                    },
                  },
                ]}
              />
            </div>
            <div className="flex-none w-2"></div>
            <div className="flex-1">
              <h2 className="text-sm font-medium mb-2">Active zones</h2>
              <p className="text-sm text-slate-400">
                Zones that have been added to this event
              </p>
              <DataTable
                pagination
                columns={zoneColumns}
                loading={isLoadingZones || isLoadingAccount}
                loadingRows={event.zones.length}
                data={
                  zoneMap
                    ? (activeZoneEvents
                        .map((zoneEvent) => [
                          zoneEvent,
                          zoneMap[zoneEvent.zoneId],
                        ])
                        .map(([zoneEvent, zone]) => ({
                          zoneEvent,
                          zone,
                          action: "remove",
                          onAction: handleSingleZoneAction,
                        })) as ZoneRow[])
                    : []
                }
                bulkActions={[
                  {
                    key: "remove",
                    label: "Remove",
                    action: async (data) => {
                      await handleZoneAction({
                        add: [],
                        remove: data.map(({ zoneEvent }) => zoneEvent),
                      });
                    },
                  },
                ]}
              />
            </div>
          </div>
          <PageWrap>
            <EventActions eventId={params.id} zones={zoneMap} />
            <div className="border-t border-t-slate-100 text-slate-300 mt-4 text-align-center pt-2 text-sm">
              <p>Event Id: {event.id}</p>
              <p>
                Created at: <DateTime dt={event.createdAt} />
              </p>
              <p>
                Updated at: <DateTime dt={event.updatedAt} />
              </p>
            </div>
          </PageWrap>
        </>
      )}
    </Page>
  );
}

function EventActions(props: {
  eventId: string | undefined;
  zones: AccountZoneMap | null;
}) {
  const { eventId, zones } = props;
  const { data } = useSWR(
    "/api/v1/events/" + eventId + "/actions",
    actionsFetcher,
  );

  const rows =
    data?.map((action) => ({
      action: action,
      zone: zones ? (zones[action.zoneId] ?? null) : null,
    })) ?? [];

  return (
    <>
      <h2 className="font-medium mt-3 mb-2">Logs</h2>
      <DataTable columns={actionColumns} data={rows} />
    </>
  );
}
