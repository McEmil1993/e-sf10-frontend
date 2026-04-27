"use client";

import { useState, type FormEvent } from "react";
import Button from "@/app/components/Button/Button";
import type { LoginFormProps } from "@/app/types/components/loginTypes";
import { ApiError, login } from "@/app/utils/api";

function MailIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm0 2v.2l8 5.33 8-5.33V8l-8 5.33L4 8Zm0 2.6V16h16v-5.4l-7.45 4.97a1 1 0 0 1-1.1 0L4 10.6Z" fill="currentColor" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M12 2a5 5 0 0 1 5 5v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1V7a5 5 0 0 1 5-5Zm3 8V7a3 3 0 1 0-6 0v3h6Zm-3 3a2 2 0 0 1 1 3.73V18h-2v-1.27A2 2 0 0 1 12 13Z" fill="currentColor" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M12 5c5.5 0 9.27 5.11 9.43 5.33l.57.8-.57.8C21.27 12.15 17.5 17.27 12 17.27S2.73 12.15 2.57 11.93L2 11.13l.57-.8C2.73 10.11 6.5 5 12 5Zm0 2c-3.62 0-6.54 2.96-7.31 4.13.77 1.17 3.69 4.14 7.31 4.14s6.54-2.97 7.31-4.14C18.54 9.96 15.62 7 12 7Zm0 1.5A2.63 2.63 0 1 1 9.38 11 2.63 2.63 0 0 1 12 8.5Z" fill="currentColor" />
    </svg>
  );
}

function EyeSlashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="m4.7 3.3 16 16-1.4 1.4-2.65-2.65A10.8 10.8 0 0 1 12 17.27c-5.5 0-9.27-5.12-9.43-5.34l-.57-.8.57-.8A18.33 18.33 0 0 1 7.3 5.7L3.3 1.7 4.7 3.3Zm4.12 4.12A7.6 7.6 0 0 0 4.7 11.13c.77 1.17 3.69 4.14 7.3 4.14a7.8 7.8 0 0 0 3.15-.67l-1.78-1.78a2.63 2.63 0 0 1-3.2-3.2L8.82 7.42ZM12 5c5.5 0 9.27 5.11 9.43 5.33l.57.8-.57.8a17.32 17.32 0 0 1-3.32 3.53l-1.42-1.42a13.5 13.5 0 0 0 2.62-2.91C18.54 9.96 15.62 7 12 7c-.76 0-1.49.13-2.17.36L8.2 5.73A9.7 9.7 0 0 1 12 5Zm-.23 4.23a2.63 2.63 0 0 1 3 3l-3-3Z" fill="currentColor" />
    </svg>
  );
}

export default function LoginForm({
  description = "Sign in to start your session",
  sampleEmails = [],
  title = "E-SF10 Login",
}: LoginFormProps) {
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasEmailError = errorMessage === "Email is required.";
  const hasPasswordError =
    errorMessage === "Password is required." ||
    errorMessage === "Invalid email or password.";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = emailValue.trim().toLowerCase();
    const password = passwordValue.trim();

    if (!email) {
      setErrorMessage("Email is required.");
      return;
    }

    if (!password) {
      setErrorMessage("Password is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const result = await login(email, password);

      if (result.user.status !== "active") {
        setErrorMessage("Only active users can sign in.");
        return;
      }

      window.location.assign("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(
          error.status === 401
            ? "Invalid email or password."
            : error.message || "Unable to sign in right now.",
        );
      } else {
        setErrorMessage("Unable to sign in right now.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1 text-center">
        <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
        <p className="text-sm text-muted">{description}</p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="email">
          Email
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <MailIcon />
          </span>
          <input
            autoComplete="email"
            aria-invalid={hasEmailError}
            className={[
              "h-11 w-full rounded-md border bg-white pl-10 pr-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2",
              hasEmailError
                ? "border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-100"
                : "border-border focus:border-primary focus:ring-sky-100",
            ].join(" ")}
            id="email"
            name="email"
            onChange={(event) => setEmailValue(event.target.value)}
            placeholder="mark@example.com"
            type="email"
            value={emailValue}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <LockIcon />
          </span>
          <input
            autoComplete="current-password"
            aria-invalid={hasPasswordError}
            className={[
              "h-11 w-full rounded-md border bg-white pl-10 pr-11 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2",
              hasPasswordError
                ? "border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-100"
                : "border-border focus:border-primary focus:ring-sky-100",
            ].join(" ")}
            id="password"
            name="password"
            onChange={(event) => setPasswordValue(event.target.value)}
            placeholder="Enter your password"
            type={showPassword ? "text" : "password"}
            value={passwordValue}
          />
          <button
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-600"
            onClick={() => setShowPassword((currentValue) => !currentValue)}
            type="button"
          >
            {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
          </button>
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
      <Button disabled={isSubmitting} fullWidth size="lg" type="submit">
        {isSubmitting ? "Signing in..." : "Sign In"}
      </Button>
      {sampleEmails.length > 0 ? (
        <div className="space-y-3 rounded-md border border-border bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Active accounts
          </p>
          <div className="flex flex-wrap gap-2">
            {sampleEmails.map((email) => (
              <span
                className="rounded bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200"
                key={email}
              >
                {email}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </form>
  );
}
