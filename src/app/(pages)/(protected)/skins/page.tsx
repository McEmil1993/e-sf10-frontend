import SkinsManager from "@/app/(pages)/(protected)/skins/skins-manager";
import { themePresetOptions } from "@/app/config/themePresets";
import { getThemeSettings } from "@/app/utils/theme";

export default async function SkinsPage() {
  const themeSettings = await getThemeSettings();

  return <SkinsManager initialSettings={themeSettings} presets={themePresetOptions} />;
}
