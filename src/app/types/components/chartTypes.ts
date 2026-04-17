export type ChartTone = "primary" | "emerald" | "amber" | "rose" | "sky";

export type ChartItem = {
  label: string;
  value: number;
  valueLabel?: string;
  tone?: ChartTone;
};

export type ChartProps = {
  title: string;
  description?: string;
  items: ChartItem[];
};
