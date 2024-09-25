import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { AccountZone, RuleAction } from "~/types";
import DateTime from "../DateTime";
import { Badge } from "~/components/ui/badge";
import { AssignableDisplayData } from "../AssignableDisplay";
import ErrorText from "../ErrorText";
import { AccountLink, ZoneLink } from "../ExternalLinks";

export type RuleActionRow = {
  action: RuleAction;
  zone: AccountZone | null;
};

export const columns: ColumnDef<RuleActionRow>[] = [
  {
    id: "createdAt",
    header: "At",
    enableColumnFilter: false,
    accessorFn: ({ action }) => action.createdAt,
    cell: (props) => {
      return <DateTime dt={props.getValue() as Date} />;
    },
  },
  {
    id: "status",
    header: "Status",
    accessorFn: ({ action }) => action.status,
    cell: (props) => {
      const v = props.getValue();
      switch (v) {
        case "success":
          return <Badge variant="outline">success</Badge>;
        case "error":
          return (
            <>
              <Badge variant="destructive">error</Badge>
              <ErrorText className="w-[240px]">
                {props.row.original.action.error}
              </ErrorText>
            </>
          );
      }
      return <Badge>{v as string}</Badge>;
    },
  },
  {
    id: "action",
    header: "Action",
    accessorFn: ({ action }) => action.action,
    cell: (props) => {
      const v = props.getValue();
      if (v === "assign") {
        try {
          const data = JSON.parse(props.row.original.action.data);
          return <AssignableDisplayData size="sm" id={data.playFromId} link />;
        } catch {
          return <span>Failed to parse `data`</span>;
        }
      } else {
        return v;
      }
    },
  },
  {
    id: "zone",
    header: "Zone",
    filterFn: "includesString",
    accessorFn: ({ zone }) => zone?.name,
    cell: (props) => {
      return (
        <ZoneLink
          data={{
            name: props.row.original.zone?.name,
            zoneId: props.row.original.zone?.id,
            accountId: props.row.original.zone?.account.id,
          }}
        />
      );
    },
  },
  {
    id: "location",
    header: "Location",
    accessorFn: ({ zone }) => zone?.location.name,
  },
  {
    id: "account",
    header: "Account",
    accessorFn: ({ zone }) => zone?.account.businessName,
    cell: (props) => {
      return (
        <AccountLink
          data={{
            id: props.row.original.zone?.account.id,
            businessName: props.row.original.zone?.account.businessName,
          }}
        />
      );
    },
  },
];
