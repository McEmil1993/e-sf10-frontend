"use client";

import { useMemo, useState, type FormEvent } from "react";
import Button from "@/app/components/Button/Button";
import UserAvatar from "@/app/components/User/UserAvatar";
import type { AdminUser } from "@/app/types/userTypes";
import { ApiError, completeTemporaryPassword } from "@/app/utils/api";

type SetNewPasswordFormProps = {
  recoveryRequestId: number;
  user: AdminUser;
};

type PasswordStrength = {
  label: string;
  score: number;
  colorClass: string;
  textClass: string;
};

function getPasswordStrength(password: string): PasswordStrength {
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;

  if (!password) {
    return {
      label: "Enter a new password",
      score: 0,
      colorClass: "bg-slate-200",
      textClass: "text-slate-500",
    };
  }

  if (score <= 2) {
    return {
      label: "Weak password",
      score: Math.max(score, 1),
      colorClass: "bg-rose-500",
      textClass: "text-rose-600",
    };
  }

  if (score <= 4) {
    return {
      label: "Good password",
      score,
      colorClass: "bg-amber-500",
      textClass: "text-amber-600",
    };
  }

  return {
    label: "Strong password",
    score,
    colorClass: "bg-emerald-500",
    textClass: "text-emerald-600",
  };
}

export default function SetNewPasswordForm({
  recoveryRequestId,
  user,
}: SetNewPasswordFormProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);
  const strengthPercent = `${(strength.score / 5) * 100}%`;
  const hasConfirmError = confirmNewPassword.length > 0 && newPassword !== confirmNewPassword;
  const profileImage = user.profile_picture || user.avatar || "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage("Confirm new password must match new password.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await completeTemporaryPassword({
        recoveryRequestId,
        newPassword,
        confirmNewPassword,
      });
      window.location.assign("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message || "Unable to change password right now.");
      } else {
        setErrorMessage("Unable to change password right now.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="w-full max-w-[440px] rounded-md border border-border bg-white p-6 shadow-sm sm:p-8"
      onSubmit={handleSubmit}
    >
      <div className="mb-6 flex flex-col items-center text-center">
        <UserAvatar
          className="h-20 w-20 text-xl"
          imageClassName="ring-4 ring-sky-100"
          name={user.name}
          src={profileImage}
        />
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Set New Password</h1>
        <p className="mt-1 text-sm text-muted">Continue by setting a new account password.</p>
        <p className="mt-3 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
          {user.email}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700" htmlFor="new-password">
            New Password
          </label>
          <input
            autoComplete="new-password"
            className="h-11 w-full rounded-md border border-border bg-white px-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-sky-100"
            id="new-password"
            name="newPassword"
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Enter new password"
            type="password"
            value={newPassword}
          />
          <div className="space-y-1">
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className={[
                  "h-full rounded-full transition-all duration-500 ease-out",
                  strength.colorClass,
                ].join(" ")}
                style={{ width: strengthPercent }}
              />
            </div>
            <p className={["text-xs font-semibold transition-colors", strength.textClass].join(" ")}>
              {strength.label}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700" htmlFor="confirm-new-password">
            Confirm New Password
          </label>
          <input
            autoComplete="new-password"
            aria-invalid={hasConfirmError}
            className={[
              "h-11 w-full rounded-md border bg-white px-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2",
              hasConfirmError
                ? "border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-100"
                : "border-border focus:border-primary focus:ring-sky-100",
            ].join(" ")}
            id="confirm-new-password"
            name="confirmNewPassword"
            onChange={(event) => setConfirmNewPassword(event.target.value)}
            placeholder="Confirm new password"
            type="password"
            value={confirmNewPassword}
          />
        </div>

        {errorMessage ? (
          <p
            className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        <Button
          disabled={isSubmitting || hasConfirmError || newPassword.length < 6}
          fullWidth
          size="lg"
          type="submit"
        >
          {isSubmitting ? "Saving..." : "Set New Password"}
        </Button>
      </div>
    </form>
  );
}
