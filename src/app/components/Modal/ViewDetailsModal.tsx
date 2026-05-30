"use client";

import type { ReactNode } from "react";
import Button from "@/app/components/Button/Button";
import Modal from "@/app/components/Modal/Modal";
import type { ModalSize } from "@/app/types/components/modalTypes";

export type ViewDetailsFieldItem = {
  label: string;
  value?: ReactNode;
  className?: string;
  valueClassName?: string;
  colSpan?: "full";
};

export type ViewDetailsSectionItem = {
  title: string;
  action?: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  fields: ViewDetailsFieldItem[];
  className?: string;
};

type ViewDetailsModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  sidebar?: ReactNode;
  sections: ViewDetailsSectionItem[];
  size?: ModalSize;
  closeLabel?: string;
  onClose: () => void;
};

function getGridClassName(columns: ViewDetailsSectionItem["columns"]) {
  if (columns === 4) {
    return "sm:grid-cols-2 xl:grid-cols-4";
  }

  if (columns === 3) {
    return "sm:grid-cols-2 xl:grid-cols-3";
  }

  if (columns === 1) {
    return "grid-cols-1";
  }

  return "sm:grid-cols-2";
}

function renderEmptyValue() {
  return <span className="text-muted">-</span>;
}

function getSectionSpanClassName(index: number, sectionCount: number) {
  if (sectionCount <= 2) {
    return "xl:col-span-5";
  }

  return index === 0 ? "xl:col-span-3" : index === 1 ? "xl:col-span-2" : "xl:col-span-5";
}

export function ViewDetailsField({
  className,
  colSpan,
  label,
  value,
  valueClassName,
}: ViewDetailsFieldItem) {
  const hasValue = value !== null && value !== undefined && value !== "";

  return (
    <div className={[colSpan === "full" ? "sm:col-span-2 xl:col-span-full" : "", className ?? ""].join(" ")}>
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">{label}</p>
      <div className={["mt-2 min-w-0 text-sm font-medium text-slate-950", valueClassName ?? ""].join(" ")}>
        {hasValue ? value : renderEmptyValue()}
      </div>
    </div>
  );
}

export function ViewDetailsSection({
  action,
  className,
  columns = 2,
  fields,
  title,
}: ViewDetailsSectionItem) {
  return (
    <section className={["rounded-[5px] border border-border bg-card p-5 shadow-sm", className ?? ""].join(" ")}>
      <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        {action}
      </div>
      <div className={["grid gap-x-8 gap-y-5 pt-4", getGridClassName(columns)].join(" ")}>
        {fields.map((field) => (
          <ViewDetailsField key={field.label} {...field} />
        ))}
      </div>
    </section>
  );
}

export default function ViewDetailsModal({
  closeLabel = "Close",
  description,
  isOpen,
  onClose,
  sections,
  sidebar,
  size = "modal-large",
  title,
}: ViewDetailsModalProps) {
  return (
    <Modal
      bodyClassName="bg-slate-100 p-4 sm:p-5"
      footer={
        <div className="flex justify-end">
          <Button onClick={onClose} variant="secondary">
            {closeLabel}
          </Button>
        </div>
      }
      footerClassName="bg-card"
      isOpen={isOpen}
      onClose={onClose}
      panelClassName="rounded-[6px]"
      size={size}
      title={title}
      description={description}
    >
      <div className={sidebar ? "grid gap-5 xl:grid-cols-[290px_minmax(0,1fr)]" : "grid gap-5"}>
        {sidebar ? <aside className="min-w-0">{sidebar}</aside> : null}
        <div className="grid min-w-0 gap-5 xl:grid-cols-5">
          {sections.map((section, index) => (
            <ViewDetailsSection
              key={`${section.title}-${index}`}
              {...section}
              className={[
                section.className ?? "",
                getSectionSpanClassName(index, sections.length),
              ].join(" ")}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}
