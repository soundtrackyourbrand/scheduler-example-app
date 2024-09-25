import React from "react";
import { PropsWithChildren } from "react";
import { cn } from "~/lib/utils";

export default function Paper(
  props: { className?: string } & PropsWithChildren,
) {
  const cx = cn("bg-card p-5 rounded-lg", props.className);
  return <div className={cx}>{props.children}</div>;
}
