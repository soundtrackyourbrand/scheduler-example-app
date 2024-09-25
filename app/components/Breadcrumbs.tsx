import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";

import { Link } from "@remix-run/react";
import { cn } from "~/lib/utils";

export type BreadcrumbItemData = {
  label: string;
  to?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItemData[];
};

export default function Breadcrumbs(
  props: { className?: string } & BreadcrumbsProps,
) {
  const cx = cn(props.className);
  return (
    <Breadcrumb className={cx}>
      <BreadcrumbList>
        {props.items.map((item, i) => {
          const els = [
            <BreadcrumbItem key={item.label}>
              {item.to ? (
                <BreadcrumbLink asChild>
                  <Link to={item.to}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>,
          ];
          if (i < props.items.length - 1) {
            els.push(<BreadcrumbSeparator key={i + "-separator"} />);
          }
          return els;
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
