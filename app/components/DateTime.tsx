import { format, formatRelative } from "date-fns";
import React from "react";

type DateTimeProps = {
  dt: Date | string | null | undefined;
  relative?: boolean;
  seconds?: boolean;
  empty?: string;
};

const fmt = "PPPP • kk:mm";
const fmtSeconds = "PPPP • kk:mm:ss";

function formatDateTime(
  dt: Date | string,
  relative: boolean,
  seconds: boolean,
): string {
  let _dt: Date | null = null;
  if (typeof dt === "string") {
    const ts = Date.parse(dt);
    if (isNaN(ts)) throw new Error("Invalid date string: " + dt);
    _dt = new Date(ts);
  } else {
    _dt = dt;
  }

  return relative
    ? formatRelative(_dt, new Date())
    : format(_dt, seconds ? fmtSeconds : fmt);
}

export default function DateTime(
  props: DateTimeProps & React.HTMLAttributes<HTMLSpanElement>,
) {
  const { dt, empty, seconds = false, relative = false, ...spanProps } = props;
  return (
    <span {...spanProps}>
      {dt ? formatDateTime(dt, relative, seconds) : (empty ?? "")}
    </span>
  );
}
