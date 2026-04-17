import { cookies } from "next/headers";
import { defaultThemeSettings, themePresetOptions } from "@/app/config/themePresets";
import type { AdminThemeSettings, ThemePresetName } from "@/app/types/themeTypes";

export const THEME_COOKIE_NAME = "tmc-itclub-theme";

const presetMap = Object.fromEntries(
  themePresetOptions.map((preset) => [preset.name, preset.settings]),
) as Record<Exclude<ThemePresetName, "custom">, AdminThemeSettings>;

function sanitizeColor(value: string | undefined, fallback: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value ?? "") ? value! : fallback;
}

function sanitizeBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function sanitizePreset(value: string | undefined) {
  if (!value) {
    return defaultThemeSettings.preset;
  }

  return value in presetMap || value === "custom"
    ? (value as ThemePresetName)
    : defaultThemeSettings.preset;
}

export function normalizeThemeSettings(
  value: Partial<AdminThemeSettings> | null | undefined,
): AdminThemeSettings {
  const preset = sanitizePreset(value?.preset);
  const presetSettings = preset === "custom" ? defaultThemeSettings : presetMap[preset];

  return {
    preset,
    background: sanitizeColor(value?.background, presetSettings.background),
    foreground: sanitizeColor(value?.foreground, presetSettings.foreground),
    card: sanitizeColor(value?.card, presetSettings.card),
    muted: sanitizeColor(value?.muted, presetSettings.muted),
    border: sanitizeColor(value?.border, presetSettings.border),
    primary: sanitizeColor(value?.primary, presetSettings.primary),
    primaryStrong: sanitizeColor(value?.primaryStrong, presetSettings.primaryStrong),
    topbarForeground: sanitizeColor(value?.topbarForeground, presetSettings.topbarForeground),
    accent: sanitizeColor(value?.accent, presetSettings.accent),
    sidebar: sanitizeColor(value?.sidebar, presetSettings.sidebar),
    sidebarForeground: sanitizeColor(value?.sidebarForeground, presetSettings.sidebarForeground),
    sidebarTitle: sanitizeColor(value?.sidebarTitle, presetSettings.sidebarTitle),
    sidebarHover: sanitizeColor(value?.sidebarHover, presetSettings.sidebarHover),
    sidebarSection: sanitizeColor(value?.sidebarSection, presetSettings.sidebarSection),
    boxedLayout: sanitizeBoolean(value?.boxedLayout, presetSettings.boxedLayout),
    compactMode: sanitizeBoolean(value?.compactMode, presetSettings.compactMode),
    hideFooter: sanitizeBoolean(value?.hideFooter, presetSettings.hideFooter),
    defaultSidebarCollapsed: sanitizeBoolean(
      value?.defaultSidebarCollapsed,
      presetSettings.defaultSidebarCollapsed,
    ),
  };
}

export async function getThemeSettings() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(THEME_COOKIE_NAME)?.value;

  if (!cookieValue) {
    return defaultThemeSettings;
  }

  try {
    return normalizeThemeSettings(JSON.parse(cookieValue) as Partial<AdminThemeSettings>);
  } catch {
    return defaultThemeSettings;
  }
}

export function getThemeBodyClassName(settings: AdminThemeSettings) {
  return [
    settings.boxedLayout ? "theme-boxed" : "",
    settings.compactMode ? "theme-compact" : "",
    settings.hideFooter ? "theme-hide-footer" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function getThemeStyle(settings: AdminThemeSettings) {
  return {
    "--background": settings.background,
    "--foreground": settings.foreground,
    "--card": settings.card,
    "--muted": settings.muted,
    "--border": settings.border,
    "--primary": settings.primary,
    "--primary-strong": settings.primaryStrong,
    "--topbar-foreground": settings.topbarForeground,
    "--accent": settings.accent,
    "--sidebar": settings.sidebar,
    "--sidebar-foreground": settings.sidebarForeground,
    "--sidebar-title": settings.sidebarTitle,
    "--sidebar-hover": settings.sidebarHover,
    "--sidebar-section": settings.sidebarSection,
  } as Record<string, string>;
}
