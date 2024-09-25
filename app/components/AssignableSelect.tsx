"use client";

import React from "react";
import useSWR from "swr";
import { accountLibraryFetcher } from "~/fetchers";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import AssignableDisplay, { AssignableDisplayData } from "./AssignableDisplay";
import { ChevronsUpDown } from "lucide-react";
import { useMusicLibrary } from "~/lib/MusicLibraryContext";
import { Link } from "@remix-run/react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Assignable } from "~/types";
import { CheckIcon } from "@radix-ui/react-icons";
import { cn } from "~/lib/utils";

type AssignableSelectProps = {
  id?: string;
  onChange: (selected: string) => void;
  value: string | null;
};

export default function AssignableSelect(props: AssignableSelectProps) {
  const { libraryId } = useMusicLibrary();
  if (!libraryId) {
    return (
      <div>
        <Button variant="outline" disabled>
          Select music
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
        <p className="text-sm mt-2">
          <span className="text-red-400">No library selected</span>
          <Link to="/settings" className="ml-2 underline">
            Go to Settings
          </Link>
        </p>
      </div>
    );
  }
  return <AssignableSelectComponent {...props} libraryId={libraryId} />;
}

function AssignableSelectComponent(
  props: { libraryId: string } & AssignableSelectProps,
) {
  const { data: library } = useSWR(
    `/api/v1/accounts/${props.libraryId}/library`,
    accountLibraryFetcher,
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          {props.value ? (
            <AssignableDisplayData id={props.value} />
          ) : (
            "Select music"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0">
        <Command>
          <CommandInput placeholder="Select music" />
          <CommandEmpty>No music found.</CommandEmpty>
          <CommandList>
            <AssignableCommandGroup
              title="Playlists"
              items={library?.playlists ?? []}
              selected={props.value}
              onChange={props.onChange}
            />
            <AssignableCommandGroup
              title="Schedules"
              items={library?.schedules ?? []}
              selected={props.value}
              onChange={props.onChange}
            />
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function AssignableCommandGroup(props: {
  title: string;
  items: Assignable[];
  selected?: string | null;
  onChange: (selected: string) => void;
}) {
  const { title, items, selected, onChange } = props;
  return (
    <CommandGroup>
      <p className="text-sm p-2 font-bold">{title}</p>
      {items.map((item) => {
        return (
          <CommandItem
            key={item.id}
            value={item.id}
            onSelect={onChange}
            keywords={["schedule", item.name]}
          >
            <div className="w-full flex items-center justify-between">
              <AssignableDisplay assignable={item} />
              <CheckIcon
                className={cn(
                  item.id === selected ? "opacity-100" : "opacity-0",
                )}
              />
            </div>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}
