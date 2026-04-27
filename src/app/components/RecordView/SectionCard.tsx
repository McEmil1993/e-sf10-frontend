import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

function SectionIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="m7 17 9.59-9.59a2 2 0 1 1 2.82 2.82L9.83 19H7v-2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function SectionCard({
  action,
  children,
  className,
  title,
}: SectionCardProps) {
  return (
    <section className={["rounded-[5px] border border-border bg-card p-5 shadow-sm", className ?? ""].join(" ").trim()}>
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {action ?? (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-[5px] bg-slate-100 text-slate-400">
            <SectionIcon />
          </span>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
