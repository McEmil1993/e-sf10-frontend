"use client";

import Button from "@/app/components/Button/Button";
import Modal from "@/app/components/Modal/Modal";
import type { ConfirmModalProps } from "@/app/types/components/modalTypes";

export default function ConfirmModal({
  cancelLabel = "Cancel",
  confirmClassName,
  confirmLabel = "Confirm",
  description,
  emphasisMessage,
  emphasisTone = "default",
  isOpen,
  itemLabel,
  onClose,
  onConfirm,
  title,
}: ConfirmModalProps) {
  const emphasisToneClassName =
    emphasisTone === "danger"
      ? "border-rose-100 bg-rose-50 text-rose-700"
      : emphasisTone === "primary"
        ? "border-sky-100 bg-sky-50 text-sky-700"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <Modal
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={onClose} variant="secondary">
            {cancelLabel}
          </Button>
          <Button className={confirmClassName} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      }
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={title}
    >
      <div className="space-y-3">
        {description ? (
          <p className="text-sm text-slate-700">
            {description}{" "}
            <span className="font-semibold text-slate-950">{itemLabel}</span>?
          </p>
        ) : null}
        {emphasisMessage ? (
          <div className={["rounded-md border px-4 py-3 text-sm", emphasisToneClassName].join(" ")}>
            {emphasisMessage}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
