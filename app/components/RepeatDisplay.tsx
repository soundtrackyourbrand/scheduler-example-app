import pluralize from "pluralize";
import { RepeatPart } from "~/types";

type RepeatDisplayProps = {
  repeat: number | null;
  repeatPart: RepeatPart | null;
  titleCase?: boolean;
  empty?: string;
};

export default function RepeatDisplay({
  repeat,
  repeatPart,
  titleCase,
  empty,
}: RepeatDisplayProps) {
  if (!repeat || !repeatPart) return empty ?? "No repeat";

  if (repeat === 1) {
    let s = "";
    switch (repeatPart) {
      case "day":
        s = "daily";
        break;
      case "hour":
        s = "hourly";
        break;
      case "minute":
        s = "every minute";
        break;
    }
    return titleCase ? ucfirst(s) : s;
  }

  return `${titleCase ? "Every" : "every"} ${pluralize(repeatPart, repeat, true)}`;
}

function ucfirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.substring(1);
}
