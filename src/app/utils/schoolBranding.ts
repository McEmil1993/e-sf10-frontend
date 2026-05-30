export const defaultAppName = "E-SF10";
export const schoolBrandingCookieName = "tmc-school-branding";
export const schoolBrandingStorageKey = "tmc-school-branding";

export type SchoolBranding = {
  schoolName: string;
  schoolLogo: string;
};

export function toSchoolBranding(value: { school_name?: string; school_logo?: string } | null | undefined): SchoolBranding | null {
  const schoolName = value?.school_name?.trim() ?? "";
  const schoolLogo = value?.school_logo?.trim() ?? "";

  if (!schoolName && !schoolLogo) {
    return null;
  }

  return {
    schoolName,
    schoolLogo,
  };
}

export function parseSchoolBranding(value: string | null | undefined): SchoolBranding | null {
  if (!value) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(decodeURIComponent(value)) as Partial<SchoolBranding>;
    const schoolName = typeof parsedValue.schoolName === "string" ? parsedValue.schoolName.trim() : "";
    const schoolLogo = typeof parsedValue.schoolLogo === "string" ? parsedValue.schoolLogo.trim() : "";

    if (!schoolName && !schoolLogo) {
      return null;
    }

    return {
      schoolName,
      schoolLogo,
    };
  } catch {
    return null;
  }
}

export function serializeSchoolBranding(branding: SchoolBranding) {
  return encodeURIComponent(JSON.stringify(branding));
}

export function cacheSchoolBranding(branding: SchoolBranding | null) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  if (!branding) {
    window.localStorage.removeItem(schoolBrandingStorageKey);
    document.cookie = `${schoolBrandingCookieName}=; Path=/; Max-Age=0; SameSite=Lax`;
    return;
  }

  const serializedBranding = serializeSchoolBranding(branding);
  const cookieBranding = {
    ...branding,
    schoolLogo: branding.schoolLogo.startsWith("data:") ? "" : branding.schoolLogo,
  };
  window.localStorage.setItem(schoolBrandingStorageKey, serializedBranding);
  document.cookie = `${schoolBrandingCookieName}=${serializeSchoolBranding(cookieBranding)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function readCachedSchoolBranding() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  const storedBranding = parseSchoolBranding(window.localStorage.getItem(schoolBrandingStorageKey));

  if (storedBranding) {
    return storedBranding;
  }

  const cookiePrefix = `${schoolBrandingCookieName}=`;
  const cookieValue = document.cookie
    .split("; ")
    .find((value) => value.startsWith(cookiePrefix))
    ?.slice(cookiePrefix.length);

  return parseSchoolBranding(cookieValue);
}

export function getSchoolShortName(name: string) {
  const parts = name
    .trim()
    .split(/[\s,.-]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !["and", "at", "of", "sa", "the"].includes(part.toLowerCase()));

  if (parts.length <= 1) {
    return (parts[0] ?? defaultAppName).slice(0, 12).toUpperCase();
  }

  return parts
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 8)
    .toUpperCase();
}
