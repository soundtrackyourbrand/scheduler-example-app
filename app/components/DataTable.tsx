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
  BookmarkFilledIcon,
  BookmarkIcon,
  CaretDownIcon,
  CaretUpIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Label } from "~/components/ui/label";
import { PopoverClose } from "@radix-ui/react-popover";
import { Skeleton } from "./ui/skeleton";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandEmpty,
  CommandList,
} from "./ui/command";
import { cn } from "~/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

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
  loading?: boolean;
  loadingRows?: number;
}

export const DataTable = function DataTable<TData, TValue>({
  columns,
  data,
  bulkActions,
  pagination,
  loading = false,
  loadingRows = 0,
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
                  disabled={selectedRows.length === 0 || loading}
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
              disabled={loading}
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
                  const handleSort = header.column.getCanSort()
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
                          <div className="flex items-center">
                            <div onClick={handleSort}>
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                            </div>
                            {header.column.getCanFilter() && (
                              <ColumnFilter column={header.column} id={id} />
                            )}
                            {header.column.getCanSort() && (
                              <div className="w-6" onClick={handleSort}>
                                {sortIcon}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length && !loading ? (
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
            ) : loading && loadingRows > 0 ? (
              <LoadingRows
                n={loadingRows}
                colSpan={table.getVisibleFlatColumns().length}
              />
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getVisibleFlatColumns().length}
                  className="h-24 text-center"
                >
                  {loading ? "Loading ..." : "No results"}
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
            <div className="flex items-center">
              <p className="text-sm text-muted-foreground mr-1">Per page</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {table.getState().pagination.pageSize}
                    <ChevronDownIcon className="ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {[10, 25, 100].map((pageSize) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={pageSize}
                        checked={
                          table.getState().pagination.pageSize === pageSize
                        }
                        onCheckedChange={(checked) => {
                          if (!checked) return;
                          table.setPageSize(pageSize);
                        }}
                      >
                        {pageSize}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage() || loading}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage() || loading}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

function LoadingRows({ n, colSpan }: { n: number; colSpan: number }) {
  const rows: React.ReactNode[] = [];
  const cell = (
    <TableCell colSpan={colSpan}>
      <Skeleton>&nbsp;</Skeleton>
    </TableCell>
  );
  for (let i = 0; i < n; i++) {
    rows.push(<TableRow key={"loadingRow-" + i}>{cell}</TableRow>);
  }
  return rows;
}

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
  const currentFilterValue = column.getFilterValue();
  return (
    <Popover>
      <PopoverTrigger>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {currentFilterValue ? (
                <BookmarkFilledIcon
                  className={
                    (currentFilterValue ? "opacity-100 " : "") +
                    "opacity-0 group-hover:opacity-100 ml-1"
                  }
                />
              ) : (
                <BookmarkIcon
                  className={"opacity-0 group-hover:opacity-100 ml-1"}
                />
              )}
            </TooltipTrigger>
            <TooltipContent>
              {currentFilterValue
                ? "This column is filtered"
                : "Click to filter"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        {filter === "select" && (
          <div>
            <Command>
              <CommandInput placeholder="Filter" />
              <CommandEmpty>No filter</CommandEmpty>
              <CommandList>
                {sortedUniqueValues.map((v, i) => {
                  return (
                    <CommandItem
                      key={v + i}
                      onSelect={() =>
                        column.setFilterValue(
                          currentFilterValue !== v ? v : null,
                        )
                      }
                    >
                      <div className="w-full flex items-center justify-between">
                        {v}
                        <CheckIcon
                          className={cn(
                            v === currentFilterValue
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandList>
            </Command>
          </div>
        )}
        {filter !== "select" && (
          <div className="p-2">
            <Label
              htmlFor={"filter-input-" + column.id + id}
              className="mb-2 block"
            >
              Filter
            </Label>
            <Input
              id={"filter-input-" + column.id + id}
              value={(column.getFilterValue() ?? "") as string}
              onChange={(e) => {
                column.setFilterValue(e.target.value);
              }}
            />
          </div>
        )}
        <div className="p-2">
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
