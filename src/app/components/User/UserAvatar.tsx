"use client";

import AuthenticatedImage from "@/app/components/Image/AuthenticatedImage";

type UserAvatarProps = {
  className?: string;
  imageClassName?: string;
  name: string;
  src?: string;
};

export function getUserInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export default function UserAvatar({
  className = "h-9 w-9",
  imageClassName = "",
  name,
  src,
}: UserAvatarProps) {
  const fallback = (
    <span
      className={[
        "inline-flex shrink-0 items-center justify-center rounded-full bg-black/10 text-xs font-semibold",
        className,
      ].join(" ")}
    >
      {getUserInitials(name)}
    </span>
  );

  if (!src?.trim()) {
    return fallback;
  }

  return (
    <AuthenticatedImage
      alt={name}
      className={[
        "shrink-0 rounded-full object-cover",
        className,
        imageClassName,
      ].join(" ")}
      fallback={fallback}
      src={src}
    />
  );
}
