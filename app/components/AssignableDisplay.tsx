import React from "react";
import useSWR from "swr";
import { assignableFetcher } from "~/fetchers";
import { Assignable } from "~/types";
import { ExternalLink } from "./ExternalLinks";
import { Skeleton } from "./ui/skeleton";

type Size = "sm" | "md";

function getSizeCx(size: Size): { img: string; text: string } {
  return size === "sm"
    ? { img: "w-5 h-5", text: "text-sm" }
    : { img: "w-6 h-6", text: "text-md" };
}
export function AssignableDisplayData(props: {
  id: string;
  size?: Size;
  link?: boolean;
}) {
  const { data: assignable } = useSWR(
    "/api/v1/assignable/" + props.id,
    assignableFetcher,
  );
  if (assignable) {
    return (
      <AssignableDisplay
        assignable={assignable}
        size={props.size}
        link={props.link}
      />
    );
  }

  const sizeCx = getSizeCx(props.size ?? "sm");

  return (
    <>
      <Skeleton className={`${sizeCx.img} mr-2 rounded block`} />
      <Skeleton className={`${sizeCx.text} w-[150px] h-[20px]`} />
    </>
  );
}

export default function AssignableDisplay(props: {
  assignable: Assignable;
  size?: Size;
  link?: boolean;
}) {
  const { size = "sm" } = props;

  const sizeCx = getSizeCx(size);

  const children = (
    <>
      <img
        src={props.assignable.imageUrl}
        className={`${sizeCx.img} mr-2 rounded block`}
      />
      <div className={sizeCx.text}>{props.assignable.name}</div>
    </>
  );

  return props.link ? (
    <ExternalLink
      href={
        "https://business.soundtrackyourbrand.com/discover/music/" +
        props.assignable.id
      }
    >
      {children}
    </ExternalLink>
  ) : (
    <div className="flex items-center">{children}</div>
  );
}
