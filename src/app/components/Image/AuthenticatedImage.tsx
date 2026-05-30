"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { apiClient, getClientAuthSession, requiresAuthenticatedAssetRequest, resolveBackendAssetUrl } from "@/app/utils/api";

type AuthenticatedImageProps = {
  alt: string;
  className?: string;
  fallback?: ReactNode;
  src: string;
};

export default function AuthenticatedImage({
  alt,
  className,
  fallback = null,
  src,
}: AuthenticatedImageProps) {
  const trimmedSrc = src.trim();
  const requiresAuth = requiresAuthenticatedAssetRequest(trimmedSrc);
  const [resolvedSrc, setResolvedSrc] = useState("");
  const [failedSrc, setFailedSrc] = useState("");

  useEffect(() => {
    if (!trimmedSrc || !requiresAuth) {
      return;
    }

    const token = getClientAuthSession()?.token;

    let isDisposed = false;
    let objectUrl = "";

    async function loadImage() {
      if (!token) {
        if (!isDisposed) {
          setResolvedSrc("");
          setFailedSrc(trimmedSrc);
        }

        return;
      }

      try {
        setResolvedSrc("");
        setFailedSrc("");

        const response = await apiClient.request<Blob>({
          url: resolveBackendAssetUrl(trimmedSrc),
          method: "GET",
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        objectUrl = URL.createObjectURL(response.data);

        if (isDisposed) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        setResolvedSrc(objectUrl);
        setFailedSrc("");
      } catch {
        if (!isDisposed) {
          setResolvedSrc("");
          setFailedSrc(trimmedSrc);
        }
      }
    }

    void loadImage();

    return () => {
      isDisposed = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [requiresAuth, trimmedSrc]);

  const displaySrc = requiresAuth ? resolvedSrc : resolveBackendAssetUrl(trimmedSrc);
  const hasError = failedSrc === (requiresAuth ? trimmedSrc : displaySrc);

  if (!displaySrc || hasError) {
    return <>{fallback}</>;
  }

  return <img alt={alt} className={className} onError={() => setFailedSrc(requiresAuth ? trimmedSrc : displaySrc)} src={displaySrc} />;
}
