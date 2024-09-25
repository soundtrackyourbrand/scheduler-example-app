"use client";

import React from "react";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Input } from "~/components/ui/input";

type DatePickerProps = {
  id?: string;
  value?: Date;
  onChange: (value: Date | undefined) => void;
};

export default function DatePicker({ value, onChange, id }: DatePickerProps) {
  const handleDateChange = (v: Date | undefined) => {
    if (v === undefined || value === undefined) {
      onChange(v);
      return;
    }
    const next = new Date(v);
    next.setHours(value.getHours(), value.getMinutes());
    onChange(next);
  };
  const handleHourChange = (v: string) => {
    if (!value) return;
    const hours = parseInt(v);
    if (isNaN(hours) || hours < 0 || hours > 23) return;
    const next = new Date(value);
    next.setHours(hours);
    onChange(next);
  };

  const handleMinuteChange = (v: string) => {
    if (!value) return;
    const minutes = parseInt(v);
    if (isNaN(minutes) || minutes < 0 || minutes > 59) return;
    const next = new Date(value);
    next.setMinutes(minutes);
    onChange(next);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant={"outline"}
          className={cn(
            "w-[300px] justify-start text-left font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP @ kk:mm") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateChange}
          initialFocus
        />
        <div className="p-1 flex items-center">
          <span className="px-2 font-medium">@</span>
          <Input
            value={value?.getHours() ?? 0}
            type="number"
            min="0"
            max="23"
            className="w-20"
            onChange={(e) => handleHourChange(e.target.value)}
          />
          <span className="px-1 font-medium">:</span>
          <Input
            value={value?.getMinutes() ?? 0}
            type="number"
            min="0"
            max="59"
            className="w-20"
            onChange={(e) => handleMinuteChange(e.target.value)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
