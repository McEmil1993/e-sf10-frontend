"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { defaultThemeSettings } from "@/app/config/themePresets";
import type { AdminThemeSettings } from "@/app/types/themeTypes";
import { normalizeThemeSettings, THEME_COOKIE_NAME } from "@/app/utils/theme";

export async function saveThemeSettingsAction(
  settings: Partial<AdminThemeSettings>,
) {
  const cookieStore = await cookies();
  const normalizedSettings = normalizeThemeSettings(settings);

  cookieStore.set(THEME_COOKIE_NAME, JSON.stringify(normalizedSettings), {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath("/", "layout");

  return normalizedSettings;
}

export async function resetThemeSettingsAction() {
  const cookieStore = await cookies();

  cookieStore.set(THEME_COOKIE_NAME, JSON.stringify(defaultThemeSettings), {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath("/", "layout");

  return defaultThemeSettings;
}
