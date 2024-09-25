import React from "react";
import { PropsWithChildren } from "react";
import { cn } from "~/lib/utils";

export default function FormControl(
  props: { className?: string } & PropsWithChildren,
) {
  const cx = cn(props.className, "mb-3");
  return <div className={cx}>{props.children}</div>;
}
