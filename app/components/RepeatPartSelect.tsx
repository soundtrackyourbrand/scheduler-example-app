import React from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";
import { RepeatPart, repeatParts } from "~/types";

type RepeatPartSelectProps = {
  value: RepeatPart | null;
  onChange: (selected: RepeatPart) => void;
  disabled?: boolean;
  className?: string;
};

export default function RepeatPartSelect(props: RepeatPartSelectProps) {
  const cx = cn(props.className, "w-[120px]");
  return (
    <Select
      value={props.value ?? ""}
      onValueChange={props.onChange}
      disabled={props.disabled}
    >
      <SelectTrigger className={cx}>
        <SelectValue placeholder="Select" />
      </SelectTrigger>
      <SelectContent>
        {repeatParts?.map((part) => {
          return (
            <SelectItem key={part} value={part}>
              {part}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
