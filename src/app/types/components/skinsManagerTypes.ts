import type { AdminThemeSettings, ThemePresetOption } from "@/app/types/themeTypes";

export type SkinsManagerProps = {
  initialSettings: AdminThemeSettings;
  presets: ThemePresetOption[];
};
