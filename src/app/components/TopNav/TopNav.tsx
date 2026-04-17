"use client";

import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import type {
  NavUtilityIconProps,
  TopNavProps,
} from "@/app/types/components/topNavTypes";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function NavUtilityIcon({ type }: NavUtilityIconProps) {
  const className = "h-7 w-7";

  if (type === "mail") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24">
        <path d="M3 6h18v12H3V6Zm2 2v.5l7 4.67 7-4.67V8l-7 4.67L5 8Z" fill="currentColor" />
      </svg>
    );
  }

  if (type === "bell") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24">
        <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5L3 18v1h18v-1l-2-2Z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <path d="M4 4h10l-1 5h7l-2 7h-8l1-5H4V4Zm2 2v3h7.56l.4-2H6Zm7.28 8H16.5l.86-3H14.1l-.82 3Z" fill="currentColor" />
    </svg>
  );
}

export default function TopNav({ isSidebarCollapsed, user, onMenuToggle }: TopNavProps) {
  return (
    <header
      className="z-30 flex h-12 items-center bg-primary shadow-sm"
      style={{ color: "var(--topbar-foreground)" }}
    >
      <div
        className={[
          "hidden h-full items-center border-r border-black/15 md:flex",
          isSidebarCollapsed ? "w-16 justify-center px-2" : "w-[250px] px-4",
        ].join(" ")}
      >
        <div className={["flex items-center", isSidebarCollapsed ? "justify-center" : "gap-2.5"].join(" ")}>
          <Image
            alt="E-SF10"
            className="h-7 w-7 rounded-sm object-cover"
            height={28}
            priority
            src="/icon.png"
            width={28}
          />
          {!isSidebarCollapsed ? <span className="text-xl font-semibold">E-SF10</span> : null}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-between px-4 sm:px-6 lg:px-8" style={{ paddingLeft: '7px' }}>
        <div className="flex items-center gap-3">
          <button
            aria-label="Toggle navigation"
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm transition hover:bg-black/10"
            onClick={onMenuToggle}
            type="button"
            style={{ color: "var(--topbar-foreground)" }}
          >
            <span className="flex flex-col gap-1">
              <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: "var(--topbar-foreground)" }} />
              <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: "var(--topbar-foreground)" }} />
              <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: "var(--topbar-foreground)" }} />
            </span>
          </button>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button className="relative hidden h-9 w-9 items-center justify-center rounded-sm transition hover:bg-black/10 sm:inline-flex" type="button">
            <NavUtilityIcon type="bell" />
            <span className="absolute right-1.5 top-1.5 rounded-sm bg-amber-500 px-1 text-[10px] font-bold leading-4 text-white">
              10
            </span>
          </button>
          <details className="relative">
            <summary
              className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full bg-black/10 text-xs font-semibold transition hover:bg-black/15"
              style={{ color: "var(--topbar-foreground)" }}
            >
              {getInitials(user.name)}
            </summary>
            <div className="absolute right-0 top-11 w-64 overflow-hidden rounded-md border border-border bg-card text-slate-900 shadow-lg">
              <div className="border-b border-border px-4 py-3">
                <p className="truncate text-sm font-semibold text-slate-950">{user.name}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
              <ul className="py-1 text-sm text-slate-700">
                <li>
                  <span className="flex w-full items-center px-4 py-2.5 text-slate-400">
                    Profile
                  </span>
                </li>
                <li>
                  <Link
                    className="flex items-center px-4 py-2.5 transition hover:bg-slate-50"
                    href="/settings"
                  >
                    Settings
                  </Link>
                </li>
                <li className="border-t border-border">
                  <form action={logoutAction}>
                    <button
                      className="flex w-full items-center px-4 py-2.5 text-left text-rose-600 transition hover:bg-rose-50"
                      type="submit"
                    >
                      Logout
                    </button>
                  </form>
                </li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
