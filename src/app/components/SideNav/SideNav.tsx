"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AppIcon from "@/app/components/Icon/AppIcon";
import type { SideNavProps } from "@/app/types/components/sideNavTypes";
import type { NavItem } from "@/app/types/navigationTypes";

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function itemHasActiveChild(pathname: string, item: NavItem) {
  return (item.children ?? []).some((child) => {
    if (child.href && isActivePath(pathname, child.href)) {
      return true;
    }

    return itemHasActiveChild(pathname, child);
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export default function SideNav({
  isCollapsed,
  isOpen,
  items,
  onClose,
  user,
}: SideNavProps) {
  const pathname = usePathname();
  const activeParents = useMemo(
    () =>
      items.reduce<Record<string, boolean>>((result, item) => {
        result[item.label] = itemHasActiveChild(pathname, item);
        return result;
      }, {}),
    [items, pathname],
  );
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(activeParents);

  useEffect(() => {
    setExpandedItems((currentValue) => ({
      ...currentValue,
      ...activeParents,
    }));
  }, [activeParents]);

  function toggleItem(label: string) {
    setExpandedItems((currentValue) => ({
      ...currentValue,
      [label]: !currentValue[label],
    }));
  }

  return (
    <>
      <div
        className={[
          "fixed inset-0 top-12 z-30 bg-slate-950/45 transition md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={onClose}
      />
      <aside
        className={[
          "fixed bottom-0 left-0 top-12 z-40 flex flex-col overflow-y-auto bg-sidebar text-sidebar-foreground shadow-xl transition-all duration-300 md:static md:h-full md:shrink-0 md:translate-x-0 md:shadow-none",
          isCollapsed ? "w-[250px] md:w-16" : "w-[250px]",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div
          className={[
            "border-b border-white/8 py-4",
            isCollapsed ? "px-2" : "px-3",
          ].join(" ")}
        >
          <div
            className={[
              "flex items-center gap-3",
              isCollapsed ? "justify-center" : "",
            ].join(" ")}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/10 text-sm font-semibold text-sidebar-title">
              {getInitials(user.name)}
            </div>
            {!isCollapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-sidebar-title">{user.name}</p>
                <div className="flex items-center gap-2 text-xs text-sidebar-foreground">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Online</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div
          className={[
            "bg-sidebar-section py-2 text-xs font-semibold uppercase tracking-wide text-slate-500",
            isCollapsed ? "px-2 text-center" : "px-4",
          ].join(" ")}
        >
          {isCollapsed ? "Nav" : "Main Navigation"}
        </div>
        <nav
          className={[
            "flex-1 space-y-0.5 overflow-y-auto py-2",
            isCollapsed ? "px-1.5" : "px-2",
          ].join(" ")}
        >
          {items.map((item) => {
            const hasChildren = Boolean(item.children?.length);
            const childActive = itemHasActiveChild(pathname, item);
            const active = item.href ? isActivePath(pathname, item.href) : childActive;
            const expanded = !isCollapsed && (expandedItems[item.label] ?? childActive);

            if (hasChildren) {
              return (
                <div className="space-y-0.5" key={item.label}>
                  <button
                    className={[
                      "group w-full rounded-sm text-sm transition",
                      isCollapsed
                        ? "flex justify-center px-2 py-3"
                        : "flex items-center gap-3 px-3 py-2.5 text-left",
                      active
                        ? "bg-primary text-topbar-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-title",
                    ].join(" ")}
                    onClick={() => toggleItem(item.label)}
                    title={item.label}
                    type="button"
                  >
                    {item.icon ? (
                      <span className="shrink-0">
                        <AppIcon className="h-4 w-4" name={item.icon} />
                      </span>
                    ) : null}
                    {!isCollapsed ? <span className="flex-1 font-medium">{item.label}</span> : null}
                    {!isCollapsed ? (
                      <svg
                        className={["h-3.5 w-3.5 transition-transform", expanded ? "rotate-90" : ""].join(" ")}
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path d="m9 6 6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    ) : null}
                  </button>
                  {!isCollapsed && expanded ? (
                    <div className="space-y-0.5 pl-3">
                      {item.children?.map((child) => {
                        const childIsActive = child.href ? isActivePath(pathname, child.href) : false;

                        return child.href ? (
                          <Link
                            className={[
                              "flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition",
                              childIsActive
                                ? "bg-primary text-topbar-foreground"
                                : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-title",
                            ].join(" ")}
                            href={child.href}
                            key={child.href}
                            onClick={onClose}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                            <span className="flex-1">{child.label}</span>
                          </Link>
                        ) : null;
                      })}
                    </div>
                  ) : null}
                </div>
              );
            }

            return item.href ? (
              <Link
                className={[
                  "group rounded-sm text-sm transition",
                  isCollapsed
                    ? "flex justify-center px-2 py-3"
                    : "flex items-center gap-3 px-3 py-2.5",
                  active
                    ? "bg-primary text-topbar-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-title",
                ].join(" ")}
                href={item.href}
                key={item.href}
                onClick={onClose}
                title={item.label}
              >
                {item.icon ? (
                  <span className="shrink-0">
                    <AppIcon className="h-4 w-4" name={item.icon} />
                  </span>
                ) : null}
                {!isCollapsed ? <span className="flex-1 font-medium">{item.label}</span> : null}
              </Link>
            ) : null;
          })}
        </nav>
      </aside>
    </>
  );
}
