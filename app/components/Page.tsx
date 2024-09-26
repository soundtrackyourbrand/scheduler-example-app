"use client";

import React from "react";
import { PropsWithChildren } from "react";
import Breadcrumbs, { BreadcrumbItemData } from "./Breadcrumbs";
import { RocketIcon } from "@radix-ui/react-icons";
import { NavLink, NavLinkProps } from "@remix-run/react";
import styles from "./Page.module.css";
import { cn } from "~/lib/utils";

type PageProps = {
  breadcrumbs?: BreadcrumbItemData[];
};

export default function Page(props: PageProps & PropsWithChildren) {
  const { breadcrumbs, children } = props;
  return (
    <div className="px-3">
      <div className="bg-navbar text-navbar-foreground py-2.5 -mx-3 px-3">
        <div className="max-w-screen-lg m-auto flex space-x-5">
          <div className="flex items-center space-x-2">
            <RocketIcon />
            <span className="text-sm">Soundtrack Scheduler</span>
          </div>
          <div className="space-x-1">
            <TopNavLink to="/events">Events</TopNavLink>
            <TopNavLink to="/settings">Settings</TopNavLink>
            <TopNavLink to="/logs">Logs</TopNavLink>
          </div>
        </div>
      </div>
      <div className="max-w-screen-lg m-auto py-3">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-3" />}
        {children}
      </div>
    </div>
  );
}

function TopNavLink(props: NavLinkProps) {
  const { className, ...rest } = props;
  const cx = cn(className, styles.topNavLink);
  return (
    <NavLink
      className={({ isActive, isPending }) =>
        isPending ? cx : isActive ? [styles.topNavLinkActive, cx].join(" ") : cx
      }
      {...rest}
    />
  );
}
