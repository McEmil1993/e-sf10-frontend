import type { WidgetProps, WidgetTone } from "@/app/types/components/widgetTypes";

const toneClasses: Record<WidgetTone, string> = {
  default: "bg-slate-500",
  primary: "bg-sky-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
};

const toneAccentClasses: Record<WidgetTone, string> = {
  default: "bg-slate-600/20 hover:bg-slate-700/20",
  primary: "bg-sky-600/20 hover:bg-sky-700/20",
  success: "bg-emerald-600/20 hover:bg-emerald-700/20",
  warning: "bg-amber-600/20 hover:bg-amber-700/20",
};

export default function Widget({
  description,
  icon,
  title,
  tone = "default",
  value,
}: WidgetProps) {
  return (
    <section
      className={[
        "overflow-hidden rounded-sm text-white shadow-sm",
        toneClasses[tone],
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4 px-4 pb-4 pt-4">
        <div className="space-y-2">
          <h3 className="text-4xl font-bold leading-none">{value}</h3>
          <p className="text-base font-medium">{title}</p>
          {description ? <p className="text-sm text-white/85">{description}</p> : null}
        </div>
        {icon ? (
          <div className="flex h-16 w-16 items-center justify-center text-white/25">
            {icon}
          </div>
        ) : null}
      </div>
      <div
        className={[
          "flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white transition",
          toneAccentClasses[tone],
        ].join(" ")}
      >
        <span>More info</span>
        <span aria-hidden="true">&gt;</span>
      </div>
    </section>
  );
}
