import { cookies } from "next/headers";
import ForgotPasswordBranding from "@/app/components/Login/ForgotPasswordBranding";
import { getPublicSchoolSettings } from "@/app/utils/api";
import { requireGuest } from "@/app/utils/auth";
import {
  parseSchoolBranding,
  schoolBrandingCookieName,
  toSchoolBranding,
} from "@/app/utils/schoolBranding";

export default async function ForgotPasswordPage() {
  await requireGuest();

  const schoolSettings = await getPublicSchoolSettings().catch(() => null);
  const cookieStore = await cookies();
  const cachedBranding = parseSchoolBranding(cookieStore.get(schoolBrandingCookieName)?.value);
  const initialBranding = toSchoolBranding(schoolSettings) ?? cachedBranding;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <ForgotPasswordBranding initialBranding={initialBranding} />
    </main>
  );
}
