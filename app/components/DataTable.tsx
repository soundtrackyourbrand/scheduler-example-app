"use client";

import React from "react";
import { Key, ReactNode, useId, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  getPaginationRowModel,
  Column,
  getFacetedRowModel,
  getFacetedUniqueValues,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  CaretDownIcon,
  CaretUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MixerHorizontalIcon,
} from "@radix-ui/react-icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Label } from "~/components/ui/label";
import { PopoverClose } from "@radix-ui/react-popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type BulkAction<TData> = {
  key: Key | null | undefined;
  label: ReactNode;
  action: (selection: TData[]) => Promise<unknown>;
};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  bulkActions?: BulkAction<TData>[];
  pagination?: boolean;
}

export const DataTable = function DataTable<TData, TValue>({
  columns,
  data,
  bulkActions,
  pagination,
}: DataTableProps<TData, TValue>) {
  const id = useId();
  const [rowSelection, setRowSelection] = useState({});
  const table = useReactTable({
    data,
    columns,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getCoreRowModel: getCoreRowModel(),
    state: {
      rowSelection,
    },
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const { columnFilters } = table.getState();

  return (
    <div>
      <div className="flex justify-between mb-0.5">
        <div>
          {bulkActions?.length && (
            <div>
              {bulkActions.map((action) => (
                <Button
                  key={action.key}
                  size="sm"
                  variant="ghost"
                  disabled={selectedRows.length === 0}
                  onClick={async () => {
                    await action.action(
                      selectedRows.map((row) => row.original),
                    );
                    table.resetRowSelection(true);
                  }}
                >
                  {action.label}
                  {selectedRows.length ? " " + selectedRows.length : ""}
                </Button>
              ))}
            </div>
          )}
        </div>
        <div>
          {columnFilters.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => table.setColumnFilters([])}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const cx = header.column.getCanSort()
                    ? "cursor-pointer select-none"
                    : undefined;
                  const onClick = header.column.getCanSort()
                    ? header.column.getToggleSortingHandler()
                    : undefined;
                  let sortIcon = null;
                  switch (header.column.getIsSorted()) {
                    case "asc":
                      sortIcon = <CaretUpIcon className="w-6 h-6 ml-0.5" />;
                      break;
                    case "desc":
                      sortIcon = <CaretDownIcon className="w-6 h-6 ml-0.5" />;
                      break;
                  }
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div className={"group flex items-center " + cx}>
                          <div className="flex items-center" onClick={onClick}>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {header.column.getCanSort() && (
                              <div className="w-6">{sortIcon}</div>
                            )}
                          </div>
                          {header.column.getCanFilter() && (
                            <ColumnFilter column={header.column} id={id} />
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 mt-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        {pagination && table.getPageCount() > 0 && (
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

function ColumnFilter<TData>(props: { id: string; column: Column<TData> }) {
  const { id, column } = props;
  const { filter } = (props.column.columnDef.meta ?? {}) as { filter?: string };

  const sortedUniqueValues = React.useMemo(
    () =>
      filter === "select"
        ? Array.from(column.getFacetedUniqueValues().keys())
            .sort()
            .slice(0, 5000)
        : [],
    [column.getFacetedUniqueValues(), filter],
  );
  return (
    <Popover>
      <PopoverTrigger asChild>
        <MixerHorizontalIcon
          className={
            (column.getFilterValue() ? "opacity-100 " : "") +
            "opacity-0 group-hover:opacity-100 ml-1"
          }
        />
      </PopoverTrigger>
      <PopoverContent>
        <Label
          htmlFor={"filter-input-" + column.id + id}
          className="mb-2 block"
        >
          Filter
        </Label>

        {filter === "select" && (
          <Select
            value={column.getFilterValue()?.toString()}
            onValueChange={column.setFilterValue}
          >
            <SelectTrigger id={"filter-input-" + column.id + id}>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {sortedUniqueValues.map((v) => {
                  return (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
        {filter !== "select" && (
          <Input
            id={"filter-input-" + column.id + id}
            value={(column.getFilterValue() ?? "") as string}
            onChange={(e) => {
              column.setFilterValue(e.target.value);
            }}
          />
        )}
        <div className="mt-2">
          <PopoverClose asChild>
            <Button size="sm" variant="outline">
              Close
            </Button>
          </PopoverClose>
          <Button
            size="sm"
            variant="ghost"
            className="ml-1"
            onClick={() => column.setFilterValue(undefined)}
          >
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
