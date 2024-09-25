import React from "react";
import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { PropsWithChildren } from "react";
import { cn } from "~/lib/utils";

export const soundtrackBaseUrl = "https://business.soundtrackyourbrand.com";

export function soundtrackUrl(path: string): string {
  return soundtrackBaseUrl + path;
}

export function ExternalLink(
  props: {
    href: string;
    text?: string | null | undefined;
    className?: string;
  } & PropsWithChildren,
) {
  const cx = cn("flex items-center hover:underline", props.className);
  return (
    <a href={props.href} target="_blank" rel="noreferrer" className={cx}>
      {props.text && <span>{props.text}</span>}
      {props.children}
      <ExternalLinkIcon className="ml-1 text-slate-400 hover:text-black flex-shrink-0" />
    </a>
  );
}

function Empty(props: { text: string | null | undefined; className?: string }) {
  return <span className={props.className}>{props.text ?? "-"}</span>;
}

export function ZoneLink(props: {
  data: {
    name: string | null | undefined;
    zoneId: string | null | undefined;
    accountId: string | null | undefined;
  };
  className?: string;
}) {
  if (!props.data.zoneId || !props.data.accountId) {
    return <Empty text={props.data.name} />;
  }
  return (
    <ExternalLink
      href={
        soundtrackBaseUrl +
        "/accounts/" +
        props.data.accountId +
        "/zones/" +
        props.data.zoneId +
        "/player"
      }
      text={props.data.name}
      className={props.className}
    />
  );
}

export function AccountLink(props: {
  data: {
    businessName: string | null | undefined;
    id: string | null | undefined;
  } | null;
  className?: string;
}) {
  if (!props.data?.id) {
    return <Empty text={props.data?.businessName} />;
  }
  return (
    <ExternalLink
      href={soundtrackBaseUrl + "/accounts/" + props.data.id + "/zones"}
      text={props.data.businessName}
      className={props.className}
    />
  );
}
