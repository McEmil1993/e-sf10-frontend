"use client";

import type { ReactNode } from "react";

type BackupPanelCardProps = {
  title: string;
  description: ReactNode;
  badgeLabel: string;
  badgeClassName: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function BackupPanelCard({
  badgeClassName,
  badgeLabel,
  children,
  description,
  footer,
  title,
}: BackupPanelCardProps) {
  return (
    <article className="rounded-md border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
        <span className={badgeClassName}>{badgeLabel}</span>
      </div>

      <div className="mt-5">{children}</div>

      {footer ? <div className="mt-5">{footer}</div> : null}
    </article>
  );
}
