import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { EventAction, Run } from "~/types";
import DateTime from "../DateTime";
import { Link } from "@remix-run/react";

export type RunRow = {
  run: Run;
};

export const columns: ColumnDef<RunRow>[] = [
  {
    id: "id",
    header: "#",
    enableColumnFilter: false,
    accessorFn: ({ run }) => run.id,
  },
  {
    id: "createdAt",
    header: "At",
    enableColumnFilter: false,
    accessorFn: ({ run }) => run.createdAt,
    cell: (props) => {
      return <DateTime dt={props.getValue() as Date} seconds />;
    },
  },
  {
    id: "actions",
    header: "Actions",
    enableColumnFilter: true,
    accessorFn: ({ run }) => run.actions.length,
    cell: (props) => {
      const run = props.row.original.run;
      const actions = run.actions;

      if (actions.length === 0) return <div className="text-slate-300">-</div>;
      return <Actions actions={run.actions} />;
    },
  },
];

export function Actions({ actions }: { actions: EventAction[] }) {
  const actionMap = actions.reduce(
    (acc, action) => {
      if (!acc[action.eventId]) {
        acc[action.eventId] = [] as EventAction[];
      }
      acc[action.eventId].push(action);
      return acc;
    },
    {} as { [keyof: number]: EventAction[] },
  );

  const eventIds = Object.keys(actionMap).map(parseInt);

  return (
    <>
      {eventIds.map((eventId) => {
        if (isNaN(eventId)) return;
        const eventActions = actionMap[eventId];
        return (
          <div key={eventId} className="flex items-center">
            <p>
              {eventActions.length} action{eventActions.length === 1 ? "" : "s"}
            </p>
            <Link
              to={"/events/" + eventId}
              className="font-medium hover:underline ml-2"
            >
              Go to event
            </Link>
          </div>
        );
      })}
    </>
  );
}
