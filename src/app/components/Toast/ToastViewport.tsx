"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ToastItem, ToastTone, ToastViewportProps } from "@/app/types/components/toastTypes";

const toastToneClasses: Record<ToastTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
};

const toastIconToneClasses: Record<ToastTone, string> = {
  success: "bg-emerald-100 text-emerald-700",
  error: "bg-rose-100 text-rose-700",
  info: "bg-sky-100 text-sky-700",
};

function ToastIcon({ tone }: { tone: ToastTone }) {
  if (tone === "success") {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path
          d="M12 3a9 9 0 1 1-9 9 9 9 0 0 1 9-9Zm4.28 6.78-5.47 5.47-3.09-3.09-1.44 1.42 4.53 4.54 6.9-6.91Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (tone === "error") {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
        <path
          d="M12 3a9 9 0 1 1-9 9 9 9 0 0 1 9-9Zm-1 4v6h2V7Zm0 8v2h2v-2Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 3a9 9 0 1 1-9 9 9 9 0 0 1 9-9Zm-1 6v6h2V9Zm0-2v1h2V7Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ToastCard({
  description,
  duration = 4500,
  id,
  onDismiss,
  title,
  tone = "info",
}: ToastItem & { onDismiss: (toastId: string) => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const dismissTimeoutRef = useRef<number | null>(null);

  const dismissWithAnimation = useCallback(() => {
    setIsVisible(false);

    if (dismissTimeoutRef.current) {
      window.clearTimeout(dismissTimeoutRef.current);
    }

    dismissTimeoutRef.current = window.setTimeout(() => {
      onDismiss(id);
    }, 220);
  }, [id, onDismiss]);

  useEffect(() => {
    const animationFrameId = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    if (duration <= 0) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      dismissWithAnimation();
    }, duration);

    return () => {
      window.clearTimeout(timeoutId);
      if (dismissTimeoutRef.current) {
        window.clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, [dismissWithAnimation, duration]);

  return (
    <div
      className={[
        "pointer-events-auto w-full max-w-sm rounded-xl border px-4 py-3 shadow-lg backdrop-blur transition-all duration-200 ease-out",
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
        toastToneClasses[tone],
      ].join(" ")}
      role="status"
    >
      <div className="flex items-center gap-3">
        <span
          className={[
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            toastIconToneClasses[tone],
          ].join(" ")}
        >
          <ToastIcon tone={tone} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <p className="text-sm font-semibold leading-5">{title}</p>
          {description ? <div className="text-sm text-slate-700">{description}</div> : null}
        </div>
        <button
          aria-label="Dismiss toast"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-black/5 hover:text-slate-600"
          onClick={dismissWithAnimation}
          type="button"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
            <path
              d="M7.4 6 12 10.6 16.6 6 18 7.4 13.4 12 18 16.6 16.6 18 12 13.4 7.4 18 6 16.6 10.6 12 6 7.4 7.4 6Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function ToastViewport({ onDismiss, toasts }: ToastViewportProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[90] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} onDismiss={onDismiss} {...toast} />
      ))}
    </div>
  );
}
