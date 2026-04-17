export type ThemePresetName =
  | "blue"
  | "black"
  | "purple"
  | "green"
  | "red"
  | "yellow"
  | "blue-light"
  | "black-light"
  | "custom";

export type AdminThemeSettings = {
  preset: ThemePresetName;
  background: string;
  foreground: string;
  card: string;
  muted: string;
  border: string;
  primary: string;
  primaryStrong: string;
  topbarForeground: string;
  accent: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarTitle: string;
  sidebarHover: string;
  sidebarSection: string;
  boxedLayout: boolean;
  compactMode: boolean;
  hideFooter: boolean;
  defaultSidebarCollapsed: boolean;
};

export type ThemePresetOption = {
  name: Exclude<ThemePresetName, "custom">;
  label: string;
  settings: AdminThemeSettings;
};
