type DetailItemProps = {
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
};

export default function DetailItem({
  className,
  label,
  value,
  valueClassName,
}: DetailItemProps) {
  return (
    <div className={["space-y-1", className ?? ""].join(" ").trim()}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className={["text-sm font-medium text-slate-900", valueClassName ?? ""].join(" ").trim()}>
        {value}
      </div>
    </div>
  );
}
