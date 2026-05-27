"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Button from "@/app/components/Button/Button";
import ToastViewport from "@/app/components/Toast/ToastViewport";
import type { ToastItem } from "@/app/types/components/toastTypes";
import { ApiError, changeCurrentUserPassword } from "@/app/utils/api";

type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const emptyValues: PasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function buildToast(title: string, description: string, tone: ToastItem["tone"]): ToastItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    description,
    tone,
  };
}

export default function ProfilePasswordForm() {
  const [values, setValues] = useState<PasswordFormValues>(emptyValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function dismissToast(toastId: string) {
    setToasts((currentValue) => currentValue.filter((toast) => toast.id !== toastId));
  }

  function updateValue<Key extends keyof PasswordFormValues>(key: Key, value: PasswordFormValues[Key]) {
    setValues((currentValue) => ({
      ...currentValue,
      [key]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (values.newPassword !== values.confirmPassword) {
      setErrorMessage("New password and confirm password must match.");
      return;
    }

    try {
      setIsSubmitting(true);

      await changeCurrentUserPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      setValues(emptyValues);
      setToasts((currentValue) => [
        buildToast("Password updated", "Your password was changed successfully.", "success"),
        ...currentValue,
      ]);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Unable to update your password right now.";

      setErrorMessage(message);
      setToasts((currentValue) => [
        buildToast("Password update failed", message, "error"),
        ...currentValue,
      ]);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <ToastViewport onDismiss={dismissToast} toasts={toasts} />

      <section className="rounded-[5px] border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Change Password</h2>
            <p className="mt-1 text-sm text-muted">
              Update your password to keep your account secure.
            </p>
          </div>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-[5px] bg-slate-100 text-slate-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <path
                d="M12 3a4 4 0 0 1 4 4v2h1a2 2 0 0 1 2 2v7a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-7a2 2 0 0 1 2-2h1V7a4 4 0 0 1 4-4Zm2 6V7a2 2 0 1 0-4 0v2h4Zm-2 4a1.5 1.5 0 0 0-.75 2.8V17h1.5v-1.2A1.5 1.5 0 0 0 12 13Z"
                fill="currentColor"
              />
            </svg>
          </span>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="currentPassword">
              Current Password
            </label>
            <input
              autoComplete="current-password"
              className="h-11 w-full rounded-[5px] border border-border bg-background px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary"
              id="currentPassword"
              onChange={(event) => updateValue("currentPassword", event.target.value)}
              type="password"
              value={values.currentPassword}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="newPassword">
                New Password
              </label>
              <input
                autoComplete="new-password"
                className="h-11 w-full rounded-[5px] border border-border bg-background px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary"
                id="newPassword"
                onChange={(event) => updateValue("newPassword", event.target.value)}
                type="password"
                value={values.newPassword}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                autoComplete="new-password"
                className="h-11 w-full rounded-[5px] border border-border bg-background px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary"
                id="confirmPassword"
                onChange={(event) => updateValue("confirmPassword", event.target.value)}
                type="password"
                value={values.confirmPassword}
              />
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-[5px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button disabled={isSubmitting} size="md" type="submit">
              {isSubmitting ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      </section>
    </>
  );
}
