"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AuthenticatedImage from "@/app/components/Image/AuthenticatedImage";
import UserAvatar from "@/app/components/User/UserAvatar";
import { activeSchoolYearChangedEvent, schoolSettingsUpdatedEvent } from "@/app/constants/events";
import logoWhite from "@/app/logo-white.png";
import type { AcademicRecord } from "@/app/types/academicTypes";
import type { SchoolSettings } from "@/app/types/systemTypes";
import type {
  NavUtilityIconProps,
  TopNavProps,
} from "@/app/types/components/topNavTypes";
import { listAcademicRecords, updateAcademicRecord } from "@/app/utils/academicApi";
import { getAssetDataUrl, getSchoolSettings, logout } from "@/app/utils/api";
import {
  cacheSchoolBranding,
  getSchoolShortName,
  readCachedSchoolBranding,
  toSchoolBranding,
} from "@/app/utils/schoolBranding";

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

function isActiveSchoolYear(record: AcademicRecord) {
  return record.isActive === true || record.isActive === 1 || record.isActive === "true";
}

function sortSchoolYears(records: AcademicRecord[]) {
  return records
    .slice()
    .sort((firstRecord, secondRecord) => {
      const firstName = String(firstRecord.name ?? "");
      const secondName = String(secondRecord.name ?? "");
      return secondName.localeCompare(firstName);
    });
}

export default function TopNav({ isSidebarCollapsed, user, onMenuToggle }: TopNavProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSchoolYearUpdating, setIsSchoolYearUpdating] = useState(false);
  const [schoolYears, setSchoolYears] = useState<AcademicRecord[]>([]);
  const [activeSchoolYearId, setActiveSchoolYearId] = useState("");
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const schoolLogo = schoolSettings?.school_logo.trim() ?? "";
  const schoolName = schoolSettings?.school_name.trim() ?? "";
  const schoolShortName = schoolName ? getSchoolShortName(schoolName) : "";
  const userProfilePicture = user.profile_picture?.trim() || user.avatar?.trim() || "";

  async function cacheSettingsBranding(settings: SchoolSettings) {
    const branding = toSchoolBranding(settings);

    if (!branding) {
      cacheSchoolBranding(null);
      return;
    }

    if (!branding.schoolLogo) {
      cacheSchoolBranding(branding);
      return;
    }

    const schoolLogoDataUrl = await getAssetDataUrl(branding.schoolLogo).catch(() => "");
    cacheSchoolBranding({
      ...branding,
      schoolLogo: schoolLogoDataUrl || branding.schoolLogo,
    });
  }

  useEffect(() => {
    let isDisposed = false;
    const cachedBranding = readCachedSchoolBranding();

    if (cachedBranding) {
      queueMicrotask(() => {
        if (!isDisposed) {
          setSchoolSettings((currentValue) => currentValue ?? {
            school_id: 0,
            deped_school_id: "",
            school_name: cachedBranding.schoolName,
            school_email: "",
            school_number: "",
            district: "",
            division: "",
            region: "",
            address: "",
            school_logo: cachedBranding.schoolLogo,
            deped_logo: "",
            other_logo: "",
            created_at: "",
            updated_at: "",
            deleted_at: null,
          });
        }
      });
    }

    async function loadSchoolSettings() {
      try {
        const settings = await getSchoolSettings();

        if (!isDisposed) {
          void cacheSettingsBranding(settings);
          setSchoolSettings(settings);
        }
      } catch {
        if (!isDisposed && !cachedBranding) {
          setSchoolSettings(null);
        }
      }
    }

    function handleSchoolSettingsUpdated(event: Event) {
      const settings = (event as CustomEvent<SchoolSettings>).detail;

      if (settings) {
        void cacheSettingsBranding(settings);
        setSchoolSettings(settings);
        return;
      }

      void loadSchoolSettings();
    }

    void loadSchoolSettings();
    window.addEventListener(schoolSettingsUpdatedEvent, handleSchoolSettingsUpdated);

    return () => {
      isDisposed = true;
      window.removeEventListener(schoolSettingsUpdatedEvent, handleSchoolSettingsUpdated);
    };
  }, []);

  useEffect(() => {
    let isDisposed = false;

    async function loadSchoolYears() {
      try {
        const records = sortSchoolYears(await listAcademicRecords("school-years"));
        const activeRecord = records.find(isActiveSchoolYear);

        if (!isDisposed) {
          setSchoolYears(records);
          setActiveSchoolYearId(activeRecord ? String(activeRecord.id) : "");
        }
      } catch {
        if (!isDisposed) {
          setSchoolYears([]);
          setActiveSchoolYearId("");
        }
      }
    }

    function handleActiveSchoolYearChanged(event: Event) {
      const detail = (event as CustomEvent<AcademicRecord | null>).detail;

      if (detail) {
        setSchoolYears((currentRecords) =>
          sortSchoolYears(
            (currentRecords.some((record) => Number(record.id) === Number(detail.id))
              ? currentRecords
              : [...currentRecords, detail]
            ).map((record) => ({
                ...record,
                isActive: Number(record.id) === Number(detail.id),
              })),
          ),
        );
        setActiveSchoolYearId(String(detail.id));
        return;
      }

      void loadSchoolYears();
    }

    void loadSchoolYears();
    window.addEventListener(activeSchoolYearChangedEvent, handleActiveSchoolYearChanged);

    return () => {
      isDisposed = true;
      window.removeEventListener(activeSchoolYearChangedEvent, handleActiveSchoolYearChanged);
    };
  }, []);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isProfileMenuOpen]);

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      setIsProfileMenuOpen(false);
      await logout();
    } finally {
      window.location.assign("/login");
    }
  }

  async function handleSchoolYearChange(nextSchoolYearId: string) {
    const selectedSchoolYearId = Number(nextSchoolYearId);

    if (!Number.isInteger(selectedSchoolYearId) || selectedSchoolYearId <= 0) {
      return;
    }

    const previousSchoolYearId = activeSchoolYearId;
    setActiveSchoolYearId(nextSchoolYearId);

    try {
      setIsSchoolYearUpdating(true);
      const updatedRecord = await updateAcademicRecord("school-years", selectedSchoolYearId, { isActive: true });

      setSchoolYears((currentRecords) =>
        sortSchoolYears(
          currentRecords.map((record) => ({
            ...record,
            isActive: Number(record.id) === Number(updatedRecord.id),
          })),
        ),
      );
      window.dispatchEvent(new CustomEvent(activeSchoolYearChangedEvent, { detail: updatedRecord }));
    } catch {
      setActiveSchoolYearId(previousSchoolYearId);
    } finally {
      setIsSchoolYearUpdating(false);
    }
  }

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
          {isSidebarCollapsed ? (
            schoolLogo ? (
              <AuthenticatedImage
                alt={schoolName || "School Logo"}
                className="h-7 w-7 rounded-sm object-contain"
                fallback={
                  <Image
                    alt="E-SF10"
                    className="rounded-sm object-cover"
                    height={24}
                    priority
                    src="/icon.png"
                    width={24}
                  />
                }
                src={schoolLogo}
              />
            ) : (
              <Image
                alt="E-SF10"
                className="rounded-sm object-cover"
                height={24}
                priority
                src="/icon.png"
                width={24}
              />
            )
          ) : schoolLogo || schoolShortName ? (
            <>
              {schoolLogo ? (
                <AuthenticatedImage
                  alt={schoolName || "School Logo"}
                  className="h-8 w-8 shrink-0 rounded-sm object-contain"
                  fallback={null}
                  src={schoolLogo}
                />
              ) : null}
              {schoolShortName ? (
                <span className="truncate text-2xl font-extrabold tracking-normal text-white" title={schoolName}>
                  {schoolShortName}
                </span>
              ) : null}
            </>
          ) : (
            <Image
              alt="E-SF10"
              className="object-contain"
              priority
              src={logoWhite}
              style={{ width: "auto", height: "28px" }}
            />
          )}
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
          <label className="hidden items-center gap-2 sm:flex">
            <span className="sr-only">Active school year</span>
            <select
              aria-label="Active school year"
              className="h-8 max-w-[138px] rounded-sm border border-white/20 bg-black/10 px-2 text-xs font-semibold text-white outline-none transition hover:bg-black/15 focus:border-white/45 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSchoolYearUpdating || schoolYears.length === 0}
              onChange={(event) => {
                void handleSchoolYearChange(event.target.value);
              }}
              value={activeSchoolYearId}
            >
              {schoolYears.length === 0 ? (
                <option value="">No school year</option>
              ) : (
                schoolYears.map((schoolYear) => (
                  <option className="text-slate-900" key={schoolYear.id} value={String(schoolYear.id)}>
                    {String(schoolYear.name ?? `SY #${schoolYear.id}`)}
                  </option>
                ))
              )}
            </select>
          </label>
          <button className="relative hidden h-9 w-9 items-center justify-center rounded-sm transition hover:bg-black/10 sm:inline-flex" type="button">
            <NavUtilityIcon type="bell" />
            <span className="absolute right-1.5 top-1.5 rounded-sm bg-amber-500 px-1 text-[10px] font-bold leading-4 text-white">
              10
            </span>
          </button>
          <div className="relative" ref={profileMenuRef}>
            <button
              aria-expanded={isProfileMenuOpen}
              aria-haspopup="menu"
              className="flex h-9 w-9 cursor-pointer list-none items-center justify-center overflow-hidden rounded-full bg-black/10 text-xs font-semibold transition hover:bg-black/15"
              onClick={() => {
                setIsProfileMenuOpen((currentValue) => !currentValue);
              }}
              style={{ color: "var(--topbar-foreground)" }}
              type="button"
            >
              <UserAvatar
                className="h-9 w-9"
                imageClassName="ring-1 ring-white/10"
                name={user.name}
                src={userProfilePicture}
              />
            </button>
            {isProfileMenuOpen ? (
              <div
                className="absolute right-0 top-11 w-64 overflow-hidden rounded-md border border-border bg-card text-slate-900 shadow-lg"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                }}
              >
              <div className="border-b border-border px-4 py-3">
                <p className="truncate text-sm font-semibold text-slate-950">{user.name}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
              <ul className="py-1 text-sm text-slate-700">
                <li>
                  <Link
                    className="flex items-center px-4 py-2.5 transition hover:bg-slate-50"
                    href="/profile"
                  >
                    Profile
                  </Link>
                </li>
                <li className="border-t border-border">
                  <button
                    className="flex w-full items-center px-4 py-2.5 text-left text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isLoggingOut}
                    onClick={() => {
                      void handleLogout();
                    }}
                    type="button"
                  >
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </button>
                </li>
              </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
