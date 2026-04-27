"use client";

import { useEffect, useState } from "react";
import type { ModalProps } from "@/app/types/components/modalTypes";

export default function Modal({
  bodyClassName,
  children,
  description,
  footer,
  footerClassName,
  headerClassName,
  isOpen,
  panelClassName,
  size = "md",
  title,
  titleClassName,
}: ModalProps) {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      requestAnimationFrame(() => setIsVisible(true));
      return;
    }

    setIsVisible(false);

    const timeout = window.setTimeout(() => setIsMounted(false), 240);

    return () => window.clearTimeout(timeout);
  }, [isOpen]);

  if (!isMounted) {
    return null;
  }

  const sizeClassName =
    size === "sm"
      ? "max-w-md"
      : size === "lg"
        ? "max-w-3xl"
        : size === "modal-large"
          ? "max-w-6xl"
        : size === "xl"
          ? "max-w-5xl"
          : "max-w-xl";

  return (
    <div
      className={[
        "fixed inset-0 z-50 flex items-center justify-center px-4 py-6 transition-all duration-300 ease-out sm:px-6 sm:py-8 lg:px-10 lg:py-10",
        isVisible ? "bg-slate-950/40 opacity-100 backdrop-blur-[2px]" : "bg-slate-950/0 opacity-0 backdrop-blur-none",
      ].join(" ")}
    >
      <div
        className={[
          "flex max-h-[calc(100vh-3rem)] w-full flex-col overflow-hidden rounded-[8px] border border-border/80 bg-card shadow-[0_24px_60px_rgba(15,23,42,0.16)] transition-all duration-300 ease-out sm:max-h-[calc(100vh-4rem)] lg:max-h-[calc(100vh-5rem)]",
          sizeClassName,
          panelClassName ?? "",
          isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-95 opacity-0",
        ].join(" ")}
      >
        <div className={["shrink-0 space-y-1.5 border-b border-border px-5 py-4 sm:px-6", headerClassName ?? ""].join(" ")}>
          <h2 className={["text-[18px] font-semibold leading-none text-slate-950 sm:text-[20px]", titleClassName ?? ""].join(" ")}>
            {title}
          </h2>
          {description ? <p className="text-sm text-muted">{description}</p> : null}
        </div>
        {children ? (
          <div className={["min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5", bodyClassName ?? ""].join(" ")}>
            {children}
          </div>
        ) : null}
        {footer ? (
          <div className={["shrink-0 border-t border-border bg-background/35 px-5 py-4 sm:px-6", footerClassName ?? ""].join(" ")}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
