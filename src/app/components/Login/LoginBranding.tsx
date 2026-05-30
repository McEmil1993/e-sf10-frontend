"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import LoginForm from "@/app/components/Login/LoginForm";
import { getPublicSchoolSettings, resolveBackendAssetUrl } from "@/app/utils/api";
import {
  cacheSchoolBranding,
  defaultAppName,
  readCachedSchoolBranding,
  toSchoolBranding,
  type SchoolBranding,
} from "@/app/utils/schoolBranding";

type LoginBrandingProps = {
  initialBranding: SchoolBranding | null;
};

export default function LoginBranding({ initialBranding }: LoginBrandingProps) {
  const [branding, setBranding] = useState<SchoolBranding | null>(initialBranding);
  const [failedLogoSrc, setFailedLogoSrc] = useState("");

  useEffect(() => {
    let isDisposed = false;
    const cachedBranding = readCachedSchoolBranding();

    if (cachedBranding) {
      queueMicrotask(() => {
        if (!isDisposed) {
          setBranding(cachedBranding);
        }
      });
    }

    async function loadPublicBranding() {
      const settings = await getPublicSchoolSettings().catch(() => null);
      const nextBranding = toSchoolBranding(settings);

      if (!nextBranding || isDisposed) {
        return;
      }

      cacheSchoolBranding(nextBranding);
      setBranding(nextBranding);
    }

    void loadPublicBranding();

    return () => {
      isDisposed = true;
    };
  }, []);

  const schoolName = branding?.schoolName.trim() ?? "";
  const schoolLogo = branding?.schoolLogo.trim() ?? "";
  const loginTitle = schoolName || `${defaultAppName} Login`;
  const resolvedSchoolLogo = useMemo(
    () => (schoolLogo ? resolveBackendAssetUrl(schoolLogo) : ""),
    [schoolLogo],
  );
  const canShowSchoolLogo = resolvedSchoolLogo && failedLogoSrc !== resolvedSchoolLogo;

  return (
    <section className="grid w-full max-w-[1120px] items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="mx-auto flex aspect-square w-full max-w-[540px] items-center justify-center bg-transparent p-2">
        {canShowSchoolLogo ? (
          <img
            alt={schoolName || "School Logo"}
            className="max-h-full max-w-full object-contain"
            onError={() => setFailedLogoSrc(resolvedSchoolLogo)}
            src={resolvedSchoolLogo}
          />
        ) : (
          <span className="text-7xl font-normal tracking-normal text-black sm:text-9xl">
            LOGO
          </span>
        )}
      </div>
      <div className="mx-auto w-full max-w-[360px] rounded-md border border-border bg-white p-6 shadow-sm sm:p-8">
        <LoginForm title={loginTitle} />
      </div>
    </section>
  );
}
