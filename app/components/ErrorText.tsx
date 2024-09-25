import React from "react";
import { PropsWithChildren, useState } from "react";
import { cn } from "~/lib/utils";

export default function ErrorText(
  props: { className?: string; show?: boolean } & PropsWithChildren,
) {
  const { children, className } = props;
  const [show, setShow] = useState<boolean>(!!props.show);

  if (!children) return;
  if (typeof children !== "string") {
    throw new Error("Only strings are allowed as children to ErrorText");
  }

  const cx = cn(
    className,
    show ? "whitespace-pre-wrap" : "truncate",
    "text-sm text-slate-500 mt-1",
  );
  return (
    <p className={cx} onClick={() => setShow((v) => !v)}>
      {show ? children : children.substring(0, 50)}
    </p>
  );
}
