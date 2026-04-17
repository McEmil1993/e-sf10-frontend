import type { ImageProps } from "next/image";

export type AppImageProps = ImageProps & {
  title?: string;
  subtitle?: string;
  wrapperClassName?: string;
  imageClassName?: string;
};
