import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { AccountZone, Zone } from "~/types";
import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";
import { AccountLink, ZoneLink } from "../ExternalLinks";
import { MinusCircledIcon, PlusCircledIcon } from "@radix-ui/react-icons";

export type ZoneRowAction = "add" | "remove";

export type ZoneRow = {
  zone: AccountZone;
  action: "add" | "remove";
  onAction: (action: ZoneRowAction, zone: Zone) => void;
};

export const columns: ColumnDef<ZoneRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "account",
    header: "Account",
    accessorFn: ({ zone }) => zone.account.businessName,
    cell: (props) => {
      return <AccountLink data={props.row.original.zone.account} />;
    },
    meta: {
      filter: "select",
    },
  },
  {
    id: "location",
    header: "Location",
    accessorFn: ({ zone }) => zone.location.name,
    meta: {
      filter: "select",
    },
  },
  {
    id: "zone",
    header: "Zone",
    filterFn: "includesString",
    accessorFn: ({ zone }) => zone.name,
    cell: (props) => {
      return (
        <ZoneLink
          data={{
            name: props.row.original.zone.name,
            zoneId: props.row.original.zone.id,
            accountId: props.row.original.zone.account.id,
          }}
        />
      );
    },
  },
  {
    accessorKey: "onAction",
    header: "",
    enableColumnFilter: false,
    enableSorting: false,
    cell: ({ row }) => {
      const { zone, onAction, action } = row.original;
      return (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            onAction(row.original.action, zone);
          }}
        >
          {action === "add" ? <PlusCircledIcon /> : <MinusCircledIcon />}
        </Button>
      );
    },
  },
];
