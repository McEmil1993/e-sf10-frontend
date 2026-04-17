import NextImage from "next/image";
import type { AppImageProps } from "@/app/types/components/imageTypes";

export default function AppImage({
  alt,
  imageClassName,
  subtitle,
  title,
  wrapperClassName,
  ...props
}: AppImageProps) {
  return (
    <div
      className={[
        "rounded-md border border-border bg-white p-4 shadow-sm",
        wrapperClassName ?? "",
      ].join(" ")}
    >
      <div className="flex items-center justify-center rounded-md bg-slate-50 p-6">
        <NextImage
          alt={alt}
          className={["h-auto w-full object-contain", imageClassName ?? ""].join(" ")}
          {...props}
        />
      </div>
      {title || subtitle ? (
        <div className="mt-4 space-y-1">
          {title ? <p className="text-sm font-semibold text-slate-950">{title}</p> : null}
          {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
