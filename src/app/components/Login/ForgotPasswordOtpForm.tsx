"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type FormEvent } from "react";
import Button from "@/app/components/Button/Button";
import { ApiError, verifyForgotPasswordOtp } from "@/app/utils/api";

type ForgotPasswordOtpFormProps = {
  email: string;
  expiresAt: string;
  recoveryRequestId: number;
};

const otpLength = 6;

function formatRemainingTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function maskEmailAddress(email: string) {
  const [localPart, domainPart] = email.split("@");

  if (!localPart || !domainPart) {
    return email;
  }

  const prefix = localPart.slice(0, Math.min(2, localPart.length));
  const suffix = localPart.length > 2 ? localPart.slice(-1) : "";
  const hiddenCount = Math.max(0, localPart.length - prefix.length - suffix.length);
  const hiddenMask = Array.from({ length: hiddenCount }, () => "•").join(" ");

  return `${prefix}${hiddenMask}${suffix}@${domainPart}`;
}

export default function ForgotPasswordOtpForm({
  email,
  expiresAt,
  recoveryRequestId,
}: ForgotPasswordOtpFormProps) {
  const [digits, setDigits] = useState<string[]>(Array.from({ length: otpLength }, () => ""));
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const otpCode = useMemo(() => digits.join(""), [digits]);
  const maskedEmail = useMemo(() => maskEmailAddress(email), [email]);
  const isExpired = remainingSeconds <= 0;

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setRemainingSeconds(Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [expiresAt]);

  function focusInput(index: number) {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  }

  function setDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);

    setDigits((currentValue) => {
      const nextValue = [...currentValue];
      nextValue[index] = digit;
      return nextValue;
    });

    if (digit && index < otpLength - 1) {
      focusInput(index + 1);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pastedDigits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, otpLength)
      .split("");

    if (pastedDigits.length === 0) {
      return;
    }

    event.preventDefault();
    setDigits(Array.from({ length: otpLength }, (_, index) => pastedDigits[index] ?? ""));
    focusInput(Math.min(pastedDigits.length, otpLength) - 1);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isExpired) {
      setErrorMessage("OTP expired. Request a new code.");
      return;
    }

    if (!/^\d{6}$/.test(otpCode)) {
      setErrorMessage("Enter the 6-digit OTP code.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await verifyForgotPasswordOtp({
        recoveryRequestId,
        email,
        otpCode,
      });
      window.location.assign("/set-new-password");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message || "Unable to verify OTP right now.");
      } else {
        setErrorMessage("Unable to verify OTP right now.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="w-full max-w-[420px] rounded-md border border-border bg-white p-6 shadow-sm sm:p-8"
      onSubmit={handleSubmit}
    >
      <div className="space-y-1 text-center">
        <h1 className="text-3xl font-semibold text-slate-900">Enter OTP</h1>
        <p className="break-all text-sm font-medium text-muted">{maskedEmail}</p>
      </div>

      <div className="mt-6 flex justify-center gap-2 sm:gap-3">
        {digits.map((digit, index) => (
          <input
            aria-label={`OTP digit ${index + 1}`}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            className="h-12 w-11 rounded-md border border-border bg-white text-center text-xl font-semibold text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100 sm:h-14 sm:w-12"
            disabled={isSubmitting || isExpired}
            inputMode="numeric"
            key={index}
            maxLength={1}
            onChange={(event) => setDigit(index, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !digits[index] && index > 0) {
                focusInput(index - 1);
              }
            }}
            onPaste={handlePaste}
            ref={(node) => {
              inputRefs.current[index] = node;
            }}
            type="text"
            value={digit}
          />
        ))}
      </div>

      <div className="mt-5 text-center">
        <p className={["text-sm font-semibold", isExpired ? "text-rose-600" : "text-slate-700"].join(" ")}>
          {isExpired ? "OTP expired" : `Expires in ${formatRemainingTime(remainingSeconds)}`}
        </p>
      </div>

      {errorMessage ? (
        <p
          className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        <Button disabled={isSubmitting || isExpired || otpCode.length !== otpLength} fullWidth size="lg" type="submit">
          {isSubmitting ? "Verifying..." : "Verify OTP"}
        </Button>
        <div className="text-center">
          <Link className="text-sm font-semibold text-primary transition hover:text-primary-dark" href="/forgot-password">
            Request new code
          </Link>
        </div>
      </div>
    </form>
  );
}
