import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { RuleAction, Run } from "~/types";
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

export function Actions({ actions }: { actions: RuleAction[] }) {
  const actionMap = actions.reduce(
    (acc, action) => {
      if (!acc[action.ruleId]) {
        acc[action.ruleId] = [] as RuleAction[];
      }
      acc[action.ruleId].push(action);
      return acc;
    },
    {} as { [keyof: number]: RuleAction[] },
  );

  const ruleIds = Object.keys(actionMap).map(parseInt);

  return (
    <>
      {ruleIds.map((ruleId) => {
        if (isNaN(ruleId)) return;
        const ruleActions = actionMap[ruleId];
        return (
          <div key={ruleId} className="flex items-center">
            <p>
              {ruleActions.length} action{ruleActions.length === 1 ? "" : "s"}
            </p>
            <Link
              to={"/rules/" + ruleId}
              className="font-medium hover:underline ml-2"
            >
              Go to rule
            </Link>
          </div>
        );
      })}
    </>
  );
}
