import type {
  ButtonProps,
  ButtonSize,
  ButtonVariant,
} from "@/app/types/components/buttonTypes";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-primary bg-primary text-white hover:border-primary-strong hover:bg-primary-strong focus-visible:outline-primary",
  secondary:
    "border border-border bg-white text-foreground hover:bg-slate-100 focus-visible:outline-slate-300",
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: "h-8 px-2.5 text-xs",
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

export default function Button({
  children,
  className,
  disabled,
  fullWidth = false,
  icon,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled}
      type={type}
      {...props}
    >
      {icon ? <span className="flex items-center justify-center">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}
