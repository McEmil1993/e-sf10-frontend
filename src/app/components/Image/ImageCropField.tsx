"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/app/components/Button/Button";
import AuthenticatedImage from "@/app/components/Image/AuthenticatedImage";
import Modal from "@/app/components/Modal/Modal";
import type { ModalField } from "@/app/types/components/modalTypes";

type ImageCropFieldProps = {
  field: ModalField;
  isViewMode: boolean;
  onChange: (name: string, fieldValue: string) => void;
  value: string;
};

type CropSource = {
  fileName: string;
  mimeType: string;
  objectUrl: string;
};

type LoadedImageSize = {
  width: number;
  height: number;
};

type CropMetrics = {
  drawHeight: number;
  drawLeft: number;
  drawTop: number;
  drawWidth: number;
  overflowX: number;
  overflowY: number;
};

const previewFrameWidth = 320;
const previewOutputWidth = 640;

function clamp(value: number, minValue: number, maxValue: number) {
  return Math.min(Math.max(value, minValue), maxValue);
}

function getOutputMimeType(mimeType: string | undefined) {
  if (mimeType === "image/png" || mimeType === "image/webp") {
    return mimeType;
  }

  return "image/jpeg";
}

function CameraIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M8.5 5.5 10 4h4l1.5 1.5H19A2.5 2.5 0 0 1 21.5 8v9A2.5 2.5 0 0 1 19 19.5H5A2.5 2.5 0 0 1 2.5 17V8A2.5 2.5 0 0 1 5 5.5h3.5ZM12 8.25A4.75 4.75 0 1 0 16.75 13 4.76 4.76 0 0 0 12 8.25Zm0 1.75A3 3 0 1 1 9 13a3 3 0 0 1 3-3Z"
        fill="currentColor"
      />
    </svg>
  );
}

function RefreshImageIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 5a7 7 0 0 1 6.05 3.48V6H20v6h-6V10h2.56A5 5 0 1 0 17 15h2a7 7 0 1 1-7-10Z"
        fill="currentColor"
      />
    </svg>
  );
}

function getCropMetrics({
  frameHeight,
  frameWidth,
  imageSize,
  panX,
  panY,
  zoom,
}: {
  frameHeight: number;
  frameWidth: number;
  imageSize: LoadedImageSize;
  panX: number;
  panY: number;
  zoom: number;
}): CropMetrics {
  const baseScale = Math.max(frameWidth / imageSize.width, frameHeight / imageSize.height);
  const scaledWidth = imageSize.width * baseScale * zoom;
  const scaledHeight = imageSize.height * baseScale * zoom;
  const overflowX = Math.max(0, scaledWidth - frameWidth);
  const overflowY = Math.max(0, scaledHeight - frameHeight);

  return {
    drawWidth: scaledWidth,
    drawHeight: scaledHeight,
    drawLeft: (frameWidth - scaledWidth) / 2 + panX * (overflowX / 2),
    drawTop: (frameHeight - scaledHeight) / 2 + panY * (overflowY / 2),
    overflowX,
    overflowY,
  };
}

export default function ImageCropField({
  field,
  isViewMode,
  onChange,
  value,
}: ImageCropFieldProps) {
  const [cropError, setCropError] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<CropSource | null>(null);
  const [imageSize, setImageSize] = useState<LoadedImageSize | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const dragStateRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);
  const cropImageRef = useRef<HTMLImageElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cropShape = field.cropShape ?? "square";
  const cropAspect = field.cropAspect && field.cropAspect > 0 ? field.cropAspect : 1;
  const frameHeight = Math.round(previewFrameWidth / cropAspect);
  const hasPreview = Boolean(value);

  useEffect(() => {
    return () => {
      if (cropSource?.objectUrl) {
        URL.revokeObjectURL(cropSource.objectUrl);
      }
    };
  }, [cropSource]);

  const cropMetrics = useMemo(() => {
    if (!imageSize) {
      return null;
    }

    return getCropMetrics({
      frameHeight,
      frameWidth: previewFrameWidth,
      imageSize,
      panX,
      panY,
      zoom,
    });
  }, [frameHeight, imageSize, panX, panY, zoom]);

  function resetCropControls() {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setImageSize(null);
  }

  function closeCropModal() {
    if (cropSource?.objectUrl) {
      URL.revokeObjectURL(cropSource.objectUrl);
    }

    dragStateRef.current = null;
    setCropSource(null);
    resetCropControls();
  }

  function openCropModal(file: File) {
    if (!file.type.startsWith("image/")) {
      setCropError("Please choose a valid image file.");
      return;
    }

    setCropError(null);
    setCropSource((currentValue) => {
      if (currentValue?.objectUrl) {
        URL.revokeObjectURL(currentValue.objectUrl);
      }

      return {
        fileName: file.name,
        mimeType: file.type,
        objectUrl: URL.createObjectURL(file),
      };
    });
    resetCropControls();
  }

  function triggerImageSelection() {
    if (isViewMode || field.disabled) {
      return;
    }

    inputRef.current?.click();
  }

  function updatePanFromPointerDelta(deltaX: number, deltaY: number) {
    if (!cropMetrics || !dragStateRef.current) {
      return;
    }

    const nextPanX =
      cropMetrics.overflowX > 0
        ? clamp(dragStateRef.current.startPanX + deltaX / (cropMetrics.overflowX / 2), -1, 1)
        : 0;
    const nextPanY =
      cropMetrics.overflowY > 0
        ? clamp(dragStateRef.current.startPanY + deltaY / (cropMetrics.overflowY / 2), -1, 1)
        : 0;

    setPanX(nextPanX);
    setPanY(nextPanY);
  }

  async function applyCrop() {
    if (!cropSource || !cropMetrics || !cropImageRef.current) {
      return;
    }

    const outputWidth = previewOutputWidth;
    const outputHeight = Math.round(outputWidth / cropAspect);
    const outputScaleX = outputWidth / previewFrameWidth;
    const outputScaleY = outputHeight / frameHeight;
    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setCropError("Unable to crop this image right now.");
      return;
    }

    context.drawImage(
      cropImageRef.current,
      cropMetrics.drawLeft * outputScaleX,
      cropMetrics.drawTop * outputScaleY,
      cropMetrics.drawWidth * outputScaleX,
      cropMetrics.drawHeight * outputScaleY,
    );

    const nextValue = canvas.toDataURL(getOutputMimeType(cropSource.mimeType), 0.92);
    onChange(field.name, nextValue);
    closeCropModal();
  }

  return (
    <div className="space-y-3">
      {hasPreview ? (
        <button
          className={[
            "flex min-h-[72px] w-full items-center gap-3 rounded-[6px] border border-dashed border-sky-200/80 bg-background px-4 py-3 text-left transition",
            isViewMode || field.disabled
              ? "cursor-default"
              : "cursor-pointer hover:border-primary/50 hover:bg-sky-50/60",
          ].join(" ")}
          disabled={isViewMode || field.disabled}
          onClick={triggerImageSelection}
          type="button"
        >
          <AuthenticatedImage
            alt={field.label}
            className={[
              "h-16 w-16 border border-border object-cover",
              cropShape === "circle" ? "rounded-full" : "rounded-md",
            ].join(" ")}
            fallback={
              <div
                className={[
                  "flex h-16 w-16 items-center justify-center border border-border bg-slate-100 text-xs font-medium text-slate-500",
                  cropShape === "circle" ? "rounded-full" : "rounded-md",
                ].join(" ")}
              >
                No image
              </div>
            }
            src={value}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-700">Profile image selected</p>
            <p className="truncate text-xs text-muted">
              {isViewMode ? "Current profile image" : "Click to replace this photo"}
            </p>
          </div>
          {!isViewMode && !field.disabled ? (
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-slate-500 shadow-sm">
              <RefreshImageIcon />
            </span>
          ) : null}
        </button>
      ) : (
        <button
          className={[
            "flex min-h-[72px] w-full items-center justify-between gap-3 rounded-[6px] border border-dashed border-sky-200/80 bg-background px-4 py-3 text-left text-sm text-muted transition",
            isViewMode || field.disabled
              ? "cursor-default"
              : "cursor-pointer hover:border-primary/50 hover:bg-sky-50/60",
          ].join(" ")}
          disabled={isViewMode || field.disabled}
          onClick={triggerImageSelection}
          type="button"
        >
          <span>No profile image selected.</span>
          {!isViewMode && !field.disabled ? (
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-slate-500 shadow-sm">
              <CameraIcon />
            </span>
          ) : null}
        </button>
      )}

      {!isViewMode && !field.disabled ? (
        <div className="flex flex-wrap items-center gap-3">
          <input
            accept={field.accept}
            className="sr-only"
            disabled={field.disabled}
            id={`file-field-${field.name}`}
            name={field.name}
            ref={inputRef}
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                openCropModal(file);
              }

              event.target.value = "";
            }}
            type="file"
          />
        </div>
      ) : null}

      {cropError ? <p className="text-xs text-rose-600">{cropError}</p> : null}

      <Modal
        description="Drag the image to reposition it, then adjust the zoom for a profile-style crop."
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button onClick={closeCropModal} variant="secondary">
              Cancel
            </Button>
            <Button disabled={!cropMetrics || !imageSize} onClick={() => void applyCrop()}>
              Apply Crop
            </Button>
          </div>
        }
        isOpen={Boolean(cropSource)}
        onClose={closeCropModal}
        size="xl"
        title="Crop Profile Image"
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_280px]">
          <div className="space-y-4">
            <div className="rounded-[24px] border border-border bg-slate-950/90 p-5">
              <div
                className={[
                  "relative mx-auto overflow-hidden bg-slate-900 shadow-inner",
                  cropShape === "circle" ? "rounded-full" : "rounded-[24px]",
                ].join(" ")}
                onPointerDown={(event) => {
                  if (!cropMetrics) {
                    return;
                  }

                  dragStateRef.current = {
                    pointerId: event.pointerId,
                    startClientX: event.clientX,
                    startClientY: event.clientY,
                    startPanX: panX,
                    startPanY: panY,
                  };
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (!dragStateRef.current || dragStateRef.current.pointerId !== event.pointerId) {
                    return;
                  }

                  updatePanFromPointerDelta(
                    event.clientX - dragStateRef.current.startClientX,
                    event.clientY - dragStateRef.current.startClientY,
                  );
                }}
                onPointerUp={(event) => {
                  if (!dragStateRef.current || dragStateRef.current.pointerId !== event.pointerId) {
                    return;
                  }

                  dragStateRef.current = null;
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }}
                onPointerLeave={(event) => {
                  if (!dragStateRef.current || dragStateRef.current.pointerId !== event.pointerId) {
                    return;
                  }

                  dragStateRef.current = null;
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }}
                style={{
                  height: `${frameHeight}px`,
                  width: `${previewFrameWidth}px`,
                }}
              >
                {cropSource ? (
                  <img
                    alt="Crop preview"
                    className="absolute max-w-none select-none"
                    draggable={false}
                    onLoad={(event) => {
                      setImageSize({
                        width: event.currentTarget.naturalWidth,
                        height: event.currentTarget.naturalHeight,
                      });
                    }}
                    ref={cropImageRef}
                    src={cropSource.objectUrl}
                    style={
                      cropMetrics
                        ? {
                            height: `${cropMetrics.drawHeight}px`,
                            left: `${cropMetrics.drawLeft}px`,
                            top: `${cropMetrics.drawTop}px`,
                            width: `${cropMetrics.drawWidth}px`,
                          }
                        : undefined
                    }
                  />
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 rounded-[20px] border border-border bg-slate-50 p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
                  <span>Zoom</span>
                  <span>{zoom.toFixed(2)}x</span>
                </div>
                <input
                  className="w-full accent-primary"
                  max="3"
                  min="1"
                  onChange={(event) => setZoom(Number(event.target.value))}
                  step="0.01"
                  type="range"
                  value={zoom}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted">Drag the image inside the frame to position the crop.</p>
                <Button onClick={resetCropControls} size="sm" variant="secondary">
                  Reset
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-[24px] border border-border bg-white p-5">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-950">Profile Preview</h3>
              <p className="text-sm text-muted">This is how the cropped image will look as an avatar.</p>
            </div>

            <div className="flex justify-center rounded-[20px] bg-slate-50 p-6">
              <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-sm ring-1 ring-slate-200">
                {cropSource ? (
                  <img
                    alt="Avatar preview"
                    className="absolute max-w-none select-none"
                    draggable={false}
                    src={cropSource.objectUrl}
                    style={
                      cropMetrics
                        ? {
                            height: `${(cropMetrics.drawHeight / frameHeight) * 112}px`,
                            left: `${(cropMetrics.drawLeft / previewFrameWidth) * 112}px`,
                            top: `${(cropMetrics.drawTop / frameHeight) * 112}px`,
                            width: `${(cropMetrics.drawWidth / previewFrameWidth) * 112}px`,
                          }
                        : undefined
                    }
                  />
                ) : null}
              </div>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="rounded-[16px] bg-slate-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Shape</dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {cropShape === "circle" ? "Circle avatar crop" : "Square crop"}
                </dd>
              </div>
              <div className="rounded-[16px] bg-slate-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Output</dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {previewOutputWidth} x {Math.round(previewOutputWidth / cropAspect)}
                </dd>
              </div>
              <div className="rounded-[16px] bg-slate-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Source File</dt>
                <dd className="mt-1 truncate font-medium text-slate-800">
                  {cropSource?.fileName ?? "No file selected"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </Modal>
    </div>
  );
}
