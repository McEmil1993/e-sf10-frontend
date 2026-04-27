"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetThemeSettingsAction, saveThemeSettingsAction } from "@/app/actions/theme";
import Button from "@/app/components/Button/Button";
import PagePlaceholder from "@/app/components/PagePlaceholder/PagePlaceholder";
import type { SkinsManagerProps } from "@/app/types/components/skinsManagerTypes";
import type { AdminThemeSettings, ThemePresetName } from "@/app/types/themeTypes";

const colorFields: Array<{
  key: keyof Pick<
    AdminThemeSettings,
    | "primary"
    | "primaryStrong"
    | "topbarForeground"
    | "background"
    | "card"
    | "border"
    | "sidebar"
    | "sidebarForeground"
    | "sidebarTitle"
    | "sidebarHover"
    | "sidebarSection"
  >;
  label: string;
}> = [
  { key: "primary", label: "Topbar / Primary" },
  { key: "primaryStrong", label: "Primary Strong" },
  { key: "topbarForeground", label: "Topbar Font" },
  { key: "background", label: "Page Background" },
  { key: "card", label: "Card Background" },
  { key: "border", label: "Border Color" },
  { key: "sidebar", label: "Sidebar Background" },
  { key: "sidebarForeground", label: "Sidebar Font" },
  { key: "sidebarTitle", label: "Sidebar Title" },
  { key: "sidebarHover", label: "Sidebar Hover" },
  { key: "sidebarSection", label: "Sidebar Section" },
];

export default function SkinsManager({
  initialSettings,
  presets,
}: SkinsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);
  const [statusMessage, setStatusMessage] = useState("");

  function updateSetting<Key extends keyof AdminThemeSettings>(
    key: Key,
    value: AdminThemeSettings[Key],
  ) {
    setSettings((currentValue) => ({
      ...currentValue,
      preset: key === "preset" ? (value as ThemePresetName) : "custom",
      [key]: value,
    }));
  }

  function applyPreset(presetName: Exclude<ThemePresetName, "custom">) {
    const selectedPreset = presets.find((preset) => preset.name === presetName);

    if (!selectedPreset) {
      return;
    }

    setSettings(selectedPreset.settings);
  }

  function handleSave() {
    startTransition(async () => {
      await saveThemeSettingsAction(settings);
      setStatusMessage("Skin settings saved to cookies.");
      router.refresh();
    });
  }

  function handleReset() {
    startTransition(async () => {
      const defaultSettings = await resetThemeSettingsAction();
      setSettings(defaultSettings);
      setStatusMessage("Skin settings reset to default.");
      router.refresh();
    });
  }

  return (
    <PagePlaceholder
      breadcrumb="Home > Skins"
      sectionLabel="Skin and layout options"
      title="Skins"
    >
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <section className="space-y-4 rounded-[5px] border border-border bg-card p-4 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">Layout Options</h2>
            <p className="text-sm text-muted">
              Save your preferred admin shell layout using cookies.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-start gap-3 rounded-[5px] border border-border bg-background px-3 py-3">
              <input
                checked={settings.defaultSidebarCollapsed}
                className="mt-1"
                onChange={(event) => updateSetting("defaultSidebarCollapsed", event.target.checked)}
                type="checkbox"
              />
              <span className="space-y-1">
                <span className="block text-sm font-semibold text-slate-900">
                  Collapse Sidebar By Default
                </span>
                <span className="block text-xs text-muted">
                  Start the desktop layout in mini sidebar mode.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-[5px] border border-border bg-background px-3 py-3">
              <input
                checked={settings.boxedLayout}
                className="mt-1"
                onChange={(event) => updateSetting("boxedLayout", event.target.checked)}
                type="checkbox"
              />
              <span className="space-y-1">
                <span className="block text-sm font-semibold text-slate-900">Boxed Layout</span>
                <span className="block text-xs text-muted">
                  Constrain the admin shell width like a boxed AdminLTE skin.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-[5px] border border-border bg-background px-3 py-3">
              <input
                checked={settings.compactMode}
                className="mt-1"
                onChange={(event) => updateSetting("compactMode", event.target.checked)}
                type="checkbox"
              />
              <span className="space-y-1">
                <span className="block text-sm font-semibold text-slate-900">Compact Mode</span>
                <span className="block text-xs text-muted">
                  Reduce main content spacing for denser admin screens.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-[5px] border border-border bg-background px-3 py-3">
              <input
                checked={settings.hideFooter}
                className="mt-1"
                onChange={(event) => updateSetting("hideFooter", event.target.checked)}
                type="checkbox"
              />
              <span className="space-y-1">
                <span className="block text-sm font-semibold text-slate-900">Hide Footer</span>
                <span className="block text-xs text-muted">
                  Remove footer text from the protected admin pages.
                </span>
              </span>
            </label>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Custom Colors</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {colorFields.map((field) => (
                <label
                  className="space-y-2 rounded-[5px] border border-border bg-background px-3 py-3"
                  key={field.key}
                >
                  <span className="block text-sm font-semibold text-slate-900">{field.label}</span>
                  <div className="flex items-center gap-3">
                    <input
                      className="h-10 w-14 rounded-[5px] border border-border bg-transparent p-1"
                      onChange={(event) => updateSetting(field.key, event.target.value)}
                      type="color"
                      value={settings[field.key]}
                    />
                    <input
                      className="h-10 flex-1 rounded-[5px] border border-border bg-card px-3 text-sm text-slate-700 outline-none"
                      onChange={(event) => updateSetting(field.key, event.target.value)}
                      value={settings[field.key]}
                    />
                  </div>
                </label>
              ))}
            </div>
          </div>
        </section>

        <div className="space-y-4">
          <section className="space-y-3 rounded-[5px] border border-border bg-card p-4 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">Skins</h2>
              <p className="text-sm text-muted">
                Apply AdminLTE-inspired presets, then customize any color you want.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {presets.map((preset) => (
                <button
                  className={[
                    "overflow-hidden rounded-[5px] border text-left transition",
                    settings.preset === preset.name
                      ? "border-primary shadow-sm"
                      : "border-border hover:border-primary/50",
                  ].join(" ")}
                  key={preset.name}
                  onClick={() => applyPreset(preset.name)}
                  type="button"
                >
                  <div className="grid grid-cols-2">
                    <span
                      className="h-9"
                      style={{ backgroundColor: preset.settings.primary }}
                    />
                    <span
                      className="h-9"
                      style={{ backgroundColor: preset.settings.sidebar }}
                    />
                  </div>
                  <div className="bg-card px-3 py-2 text-sm font-semibold text-slate-800">
                    {preset.label}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-[5px] border border-border bg-card p-4 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">Preview</h2>
              <p className="text-sm text-muted">Quick shell preview before saving.</p>
            </div>

            <div className="overflow-hidden rounded-[5px] border border-border">
              <div
                className="flex items-center justify-between px-4 py-3 text-sm font-semibold"
                style={{
                  backgroundColor: settings.primary,
                  color: settings.topbarForeground,
                }}
              >
                <span>Top Navigation</span>
                <span>Skin Preview</span>
              </div>
              <div className="grid grid-cols-[110px_1fr]">
                <div style={{ backgroundColor: settings.sidebar }}>
                  <div
                    className="border-b px-3 py-3 text-sm font-semibold"
                    style={{
                      borderColor: settings.sidebarSection,
                      color: settings.sidebarTitle,
                    }}
                  >
                    Sidebar
                  </div>
                  <div
                    className="px-3 py-3 text-sm"
                    style={{ color: settings.sidebarForeground }}
                  >
                    Navigation
                  </div>
                  <div
                    className="px-3 py-3 text-sm"
                    style={{
                      backgroundColor: settings.sidebarHover,
                      color: settings.sidebarTitle,
                    }}
                  >
                    Active Link
                  </div>
                </div>
                <div
                  className="space-y-3 p-4"
                  style={{ backgroundColor: settings.background, color: settings.foreground }}
                >
                  <div className="text-sm font-semibold">Content Area</div>
                  <div
                    className="rounded-[5px] border px-3 py-3 text-sm shadow-sm"
                    style={{
                      backgroundColor: settings.card,
                      borderColor: settings.border,
                    }}
                  >
                    Cards, tables, and content surfaces will use this look.
                  </div>
                </div>
              </div>
            </div>

            {statusMessage ? (
              <div className="rounded-[5px] border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {statusMessage}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="sm:flex-1"
                disabled={isPending}
                onClick={handleSave}
              >
                {isPending ? "Saving..." : "Save Skin"}
              </Button>
              <Button
                className="sm:flex-1"
                disabled={isPending}
                onClick={handleReset}
                variant="secondary"
              >
                Reset Default
              </Button>
            </div>
          </section>
        </div>
      </div>
    </PagePlaceholder>
  );
}
