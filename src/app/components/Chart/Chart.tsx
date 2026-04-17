import type { ChartProps, ChartTone } from "@/app/types/components/chartTypes";

const toneClasses: Record<ChartTone, string> = {
  primary: "bg-primary",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
};

export default function Chart({ description, items, title }: ChartProps) {
  const highestValue = items.reduce((max, item) => Math.max(max, item.value), 0) || 1;

  return (
    <section className="overflow-hidden rounded-[5px] border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description ? <p className="text-sm text-muted">{description}</p> : null}
      </div>
      <div className="space-y-5 p-4">
        {items.map((item) => (
          <div className="space-y-2" key={item.label}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className="text-muted">
                {item.valueLabel ?? item.value.toLocaleString()}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-200">
              <div
                className={[
                  "h-2.5 rounded-full transition-all",
                  toneClasses[item.tone ?? "primary"],
                ].join(" ")}
                style={{ width: `${(item.value / highestValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
