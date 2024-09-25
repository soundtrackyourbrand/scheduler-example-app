import React from "react";
import { useState } from "react";
import useSWR from "swr";
import { Actions, columns } from "~/components/columns/run";
import { DataTable } from "~/components/DataTable";
import DateTime from "~/components/DateTime";
import Page from "~/components/Page";
import Paper from "~/components/Paper";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { runsFetcher } from "~/fetchers";
import { MetaFunction } from "@remix-run/node";
import { pageTitle } from "~/lib/utils";

export const meta: MetaFunction = () => {
  return [{ title: pageTitle("Logs") }];
};

export default function Logs() {
  const { data } = useSWR("/api/v1/runs", runsFetcher);
  const [actionsOnly, setActionsOnly] = useState<boolean>(true);

  const lastRun = data?.at(0);

  const visible = actionsOnly
    ? data?.filter((run) => run.actions.length > 0)
    : data;

  return (
    <Page breadcrumbs={[{ label: "Logs" }]}>
      {lastRun && (
        <Paper className="mb-5">
          <h2 className="font-medium">
            Last run <span className="text-slate-400">#{lastRun.id}</span>
          </h2>
          <DateTime dt={lastRun.createdAt} relative />
          <Actions actions={lastRun.actions} />
        </Paper>
      )}
      <div className="flex items-center mb-2">
        <Checkbox
          id="actions-only-cb"
          checked={actionsOnly}
          onCheckedChange={(checked) => setActionsOnly(!!checked)}
        />
        <Label htmlFor="actions-only-cb" className="ml-2">
          Runs with actions
        </Label>
      </div>
      <DataTable
        columns={columns}
        data={visible?.map((run) => ({ run })) ?? []}
        pagination
      />
    </Page>
  );
}
