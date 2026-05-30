"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import Button from "@/app/components/Button/Button";
import { ApiError, forgotPassword, getPublicSchoolSettings, resolveBackendAssetUrl } from "@/app/utils/api";
import {
  cacheSchoolBranding,
  readCachedSchoolBranding,
  toSchoolBranding,
  type SchoolBranding,
} from "@/app/utils/schoolBranding";

type ForgotPasswordBrandingProps = {
  initialBranding: SchoolBranding | null;
};

function MailIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm0 2v.2l8 5.33 8-5.33V8l-8 5.33L4 8Zm0 2.6V16h16v-5.4l-7.45 4.97a1 1 0 0 1-1.1 0L4 10.6Z" fill="currentColor" />
    </svg>
  );
}

export default function ForgotPasswordBranding({ initialBranding }: ForgotPasswordBrandingProps) {
  const [branding, setBranding] = useState<SchoolBranding | null>(initialBranding);
  const [identifier, setIdentifier] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const schoolName = branding?.schoolName.trim() ?? "E-SF10";
  const schoolLogo = branding?.schoolLogo.trim() ?? "";
  const resolvedSchoolLogo = useMemo(
    () => (schoolLogo ? resolveBackendAssetUrl(schoolLogo) : ""),
    [schoolLogo],
  );
  const canShowSchoolLogo = resolvedSchoolLogo && failedLogoSrc !== resolvedSchoolLogo;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedIdentifier = identifier.trim().toLowerCase();

    if (!normalizedIdentifier) {
      setErrorMessage("Email or username is required.");
      setSuccessMessage(null);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      const result = await forgotPassword(normalizedIdentifier);

      if (result.method === "otp_email") {
        const query = new URLSearchParams({
          email: result.email ?? normalizedIdentifier,
          recoveryRequestId: String(result.recoveryRequestId),
          expiresAt: result.expiresAt,
        });
        window.location.assign(`/forgot-password/otp?${query.toString()}`);
        return;
      }

      setSuccessMessage("Temporary password sent. It expires in 1 hour.");
      setIdentifier("");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message || "Unable to send temporary password right now.");
      } else {
        setErrorMessage("Unable to send temporary password right now.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="grid w-full max-w-[1120px] items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className="mx-auto flex aspect-square w-full max-w-[540px] items-center justify-center bg-transparent p-2">
        {canShowSchoolLogo ? (
          <img
            alt={`${schoolName} Logo`}
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
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1 text-center">
            <h1 className="text-3xl font-semibold text-slate-900">Forgot Password</h1>
            <p className="text-sm text-muted">{schoolName}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700" htmlFor="recovery-email">
              Email / Username
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <MailIcon />
              </span>
              <input
                autoComplete="username"
                aria-invalid={Boolean(errorMessage)}
                className={[
                  "h-11 w-full rounded-md border bg-white pl-10 pr-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2",
                  errorMessage
                    ? "border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-100"
                    : "border-border focus:border-primary focus:ring-sky-100",
                ].join(" ")}
                id="recovery-email"
                name="identifier"
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="email or username"
                type="text"
                value={identifier}
              />
            </div>
          </div>
          {errorMessage ? (
            <p
              className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}
          {successMessage ? (
            <p
              className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
              role="status"
            >
              {successMessage}
            </p>
          ) : null}
          <Button disabled={isSubmitting} fullWidth size="lg" type="submit">
            {isSubmitting ? "Sending..." : "Send Recovery Email"}
          </Button>
          <div className="text-center">
            <Link className="text-sm font-semibold text-primary transition hover:text-primary-dark" href="/login">
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
