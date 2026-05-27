import type { ReactNode } from "react";

type PagePlaceholderProps = {
  title: string;
  sectionLabel?: string;
  breadcrumb: string;
  description?: string;
  panelTitle?: string;
  children?: ReactNode;
  contentClassName?: string;
};

export default function PagePlaceholder({
  title,
  sectionLabel,
  breadcrumb,
  description,
  panelTitle,
  children,
  contentClassName = "space-y-4",
}: PagePlaceholderProps) {
  return (
    <div className={contentClassName}>
      <section className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[32px] font-light text-slate-900">{title}</h1>
          {sectionLabel ? <p className="text-sm text-muted">{sectionLabel}</p> : null}
        </div>
        <div className="text-sm text-muted">{breadcrumb}</div>
      </section>

      {children ? (
        children
      ) : (
        <section className="rounded-[5px] border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{panelTitle ?? title}</h2>
          {description ? <p className="mt-2 text-sm text-muted">{description}</p> : null}
        </section>
      )}
    </div>
  );
}
