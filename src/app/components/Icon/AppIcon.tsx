"use client";

import type { AppIconProps } from "@/app/types/components/appIconTypes";

export default function AppIcon({ className = "h-4 w-4", name = "shield" }: AppIconProps) {
  if (name === "administration") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24">
        <path d="M4 5h16v4H4V5Zm2 6h5v8H6v-8Zm7 0h5v3h-5v-3Zm0 5h5v3h-5v-3Z" fill="currentColor" />
      </svg>
    );
  }

  if (name === "dashboard") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24">
        <path d="M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6Zm10-10h8V3h-8v8Z" fill="currentColor" />
      </svg>
    );
  }

  if (name === "users") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24">
        <path d="M16 11a4 4 0 1 0-3.999-4A4 4 0 0 0 16 11Zm-8 1a3 3 0 1 0-2.999-3A3 3 0 0 0 8 12Zm8 2c-2.671 0-8 1.34-8 4v2h16v-2c0-2.66-5.329-4-8-4ZM8 14c-.29 0-.62.02-.97.05C5.7 14.19 3 14.86 3 17v2h4v-1c0-1.16.61-2.18 1.69-2.95A12.5 12.5 0 0 0 8 14Z" fill="currentColor" />
      </svg>
    );
  }

  if (name === "settings" || name === "shield") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24">
        <path d="m12 3 1.22 2.47 2.73.4.8 2.64 2.47 1.22-.8 2.64.8 2.64-2.47 1.22-.8 2.64-2.73.4L12 21l-1.22-2.47-2.73-.4-.8-2.64L4.78 14.27l.8-2.64-.8-2.64 2.47-1.22.8-2.64 2.73-.4L12 3Zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" fill="currentColor" />
      </svg>
    );
  }

  if (name === "products") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24">
        <path d="m12 2 8 4v12l-8 4-8-4V6l8-4Zm0 2.24L6.5 7 12 9.76 17.5 7 12 4.24ZM5 8.62v8.14l6 3v-8.14l-6-3Zm8 11.14 6-3V8.62l-6 3v8.14Z" fill="currentColor" />
      </svg>
    );
  }

  if (name === "orders") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24">
        <path d="M7 18c-1.1 0-1.99.9-1.99 2A2 2 0 0 0 7 22a2 2 0 0 0 0-4Zm10 0c-1.1 0-1.99.9-1.99 2A2 2 0 0 0 17 22a2 2 0 0 0 0-4ZM7.17 14h9.95c.75 0 1.4-.41 1.74-1.03l3.58-6.49A1 1 0 0 0 21.56 5H6.21l-.94-2H2v2h2l3.6 7.59-1.35 2.45A1.995 1.995 0 0 0 8 18h12v-2H8l1.17-2Z" fill="currentColor" />
      </svg>
    );
  }

  if (name === "analytics" || name === "chart") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24">
        <path d="M5 9.2h2.4V19H5V9.2Zm5.8-4.2h2.4V19h-2.4V5Zm5.8 7h2.4v7h-2.4v-7Z" fill="currentColor" />
      </svg>
    );
  }

  if (name === "reports" || name === "document") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24">
        <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1.5V8h4.5L14 3.5ZM8 12h8v1.5H8V12Zm0 4h8v1.5H8V16Zm0-8h3v1.5H8V8Z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <path d="M4 5h16v14H4V5Zm2 2v10h12V7H6Zm2 2h3v3H8V9Zm5 0h3v3h-3V9Zm-5 5h8v1.5H8V14Z" fill="currentColor" />
    </svg>
  );
}
