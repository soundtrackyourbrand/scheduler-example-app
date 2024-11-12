import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { AccountZone, ZoneEvent } from "~/types";
import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";
import { AccountLink, ZoneLink } from "../ExternalLinks";
import { MinusCircledIcon, PlusCircledIcon } from "@radix-ui/react-icons";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export type ZoneRowAction = "add" | "remove";

export type ZoneRowActionData = { zoneId: string; accountId: string };

export type ZoneRow = {
  zoneEvent: Omit<ZoneEvent, "id">;
  zone: AccountZone | undefined;
  action: "add" | "remove";
  onAction: (action: ZoneRowAction, data: ZoneRowActionData) => void;
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
    accessorFn: ({ zone }) => zone?.account.businessName,
    cell: (props) => {
      return props.row.original.zone ? (
        <AccountLink data={props.row.original.zone.account} />
      ) : null;
    },
    meta: {
      filter: "select",
    },
  },
  {
    id: "location",
    header: "Location",
    accessorFn: ({ zone }) => zone?.location?.name,
    meta: {
      filter: "select",
    },
  },
  {
    id: "zone",
    header: "Zone",
    filterFn: "includesString",
    accessorFn: ({ zoneEvent, zone }) => zone?.name ?? zoneEvent.zoneId,
    cell: (props) => {
      return props.row.original.zone ? (
        <ZoneLink
          data={{
            name: props.row.original.zone.name,
            zoneId: props.row.original.zone.id,
            accountId: props.row.original.zone.account.id,
          }}
        />
      ) : (
        <p className="w-[150px] truncate">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost">Zone not available</Button>
            </PopoverTrigger>
            <PopoverContent className="overflow-auto text-sm">
              <p className="font-bold">Zone not available</p>
              <p>
                Could not load data for zone:{" "}
                {props.row.original.zoneEvent.zoneId}
              </p>
            </PopoverContent>
          </Popover>
        </p>
      );
    },
  },
  {
    accessorKey: "onAction",
    header: "",
    enableColumnFilter: false,
    enableSorting: false,
    cell: ({ row }) => {
      const { zoneEvent, onAction, action } = row.original;
      return (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onAction(action, zoneEvent)}
        >
          {action === "add" ? <PlusCircledIcon /> : <MinusCircledIcon />}
        </Button>
      );
    },
  },
];
