"use client";

import { useEffect, useState } from "react";
import type { TableActionTone, TableColumn, TableProps } from "@/app/types/tableTypes";

const actionToneClasses: Record<TableActionTone, string> = {
  default: "border-border text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  primary: "border-sky-200 text-sky-600 hover:bg-sky-50 hover:text-sky-700",
  danger: "border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700",
};

function getRawValue<T extends Record<string, unknown>>(row: T, key?: keyof T | string) {
  if (!key) {
    return undefined;
  }

  return row[key as keyof T];
}

function getCellValue<T extends Record<string, unknown>>(row: T, key: keyof T | string) {
  const value = getRawValue(row, key);

  if (value === null || value === undefined) {
    return "-";
  }

  return String(value);
}

function getInitialLetter(value: string) {
  return value.trim().charAt(0).toUpperCase() || "?";
}

function renderAvatar<T extends Record<string, unknown>>(row: T, column: TableColumn<T>) {
  const imageValue = getRawValue(row, column.avatarImageKey);
  const imagePath = typeof imageValue === "string" ? imageValue.trim() : "";
  const fallbackValue = getCellValue(row, column.avatarFallbackKey ?? column.key);

  if (imagePath) {
    return (
      <img
        alt={fallbackValue}
        className={[
          "h-9 w-9 rounded-full object-cover",
          column.avatarClassName ?? "",
        ].join(" ")}
        src={imagePath}
      />
    );
  }

  return (
    <span
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700",
        column.avatarClassName ?? "",
        column.avatarTextClassName ?? "",
      ].join(" ")}
    >
      {getInitialLetter(fallbackValue)}
    </span>
  );
}

function renderCellContent<T extends Record<string, unknown>>(row: T, column: TableColumn<T>) {
  if (column.type === "actions") {
    return (
      <div className="flex items-center gap-2">
        {column.actions?.map((action) => (
          <button
            className={[
              "inline-flex h-8 w-8 items-center justify-center rounded-sm border transition",
              actionToneClasses[action.tone ?? "default"],
            ].join(" ")}
            key={action.label}
            onClick={() => action.onClick(row)}
            title={action.label}
            type="button"
          >
            {action.icon}
          </button>
        ))}
      </div>
    );
  }

  const value = getCellValue(row, column.key);

  if (column.type === "stacked") {
    const secondaryValue = column.secondaryKey ? getCellValue(row, column.secondaryKey) : "-";

    return (
      <div className="flex items-center gap-3">
        {column.showAvatar ? renderAvatar(row, column) : null}
        <div className="flex flex-col">
          <span className={column.valueClassName}>{value}</span>
          <span className={column.secondaryValueClassName}>{secondaryValue}</span>
        </div>
      </div>
    );
  }

  if (column.type === "badge") {
    const toneClassName = column.toneMap?.[value] ?? "";

    return (
      <span className={[column.badgeClassName ?? "", toneClassName].join(" ").trim()}>
        {value}
      </span>
    );
  }

  if (column.valueClassName) {
    return <span className={column.valueClassName}>{value}</span>;
  }

  return value;
}

function getSearchValue<T extends Record<string, unknown>>(row: T) {
  return Object.values(row)
    .map((value) => {
      if (value === null || value === undefined) {
        return "";
      }

      return String(value);
    })
    .join(" ")
    .toLowerCase();
}

function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 1) {
    return [1];
  }

  const visiblePages = new Set<number>([1, totalPages, currentPage]);

  if (currentPage - 1 > 1) {
    visiblePages.add(currentPage - 1);
  }

  if (currentPage + 1 < totalPages) {
    visiblePages.add(currentPage + 1);
  }

  return Array.from(visiblePages).sort((firstPage, secondPage) => firstPage - secondPage);
}

export default function Table<T extends Record<string, unknown>>({
  columns,
  data,
  defaultPageSize = 10,
  emptyMessage = "No data available.",
  pageSizeOptions = [10, 25, 50, 100],
  rowKey,
  searchPlaceholder = "Search",
  showControls = true,
  search,
  pagination,
}: TableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [currentPage, setCurrentPage] = useState(1);
  const isExternalPagination = Boolean(pagination);
  const activeSearchTerm = search?.value ?? searchTerm;
  const activePageSize = pagination?.perPage ?? pageSize;

  const filteredData = isExternalPagination
    ? data
    : data.filter((row) => getSearchValue(row).includes(activeSearchTerm.toLowerCase()));
  const totalEntries = pagination?.total ?? filteredData.length;
  const totalPages = pagination?.totalPages ?? Math.max(1, Math.ceil(totalEntries / activePageSize));
  const safeCurrentPage = pagination?.page ?? Math.min(currentPage, totalPages);
  const startIndex = totalEntries === 0 ? 0 : (safeCurrentPage - 1) * activePageSize;
  const paginatedData = isExternalPagination
    ? filteredData
    : filteredData.slice(startIndex, startIndex + activePageSize);
  const endIndex = totalEntries === 0 ? 0 : Math.min(startIndex + paginatedData.length, totalEntries);
  const paginationItems = getPaginationItems(safeCurrentPage, totalPages);

  useEffect(() => {
    if (isExternalPagination) {
      return;
    }

    setCurrentPage(1);
  }, [isExternalPagination, activeSearchTerm, activePageSize]);

  useEffect(() => {
    if (isExternalPagination) {
      return;
    }

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, isExternalPagination, totalPages]);

  return (
    <div className="overflow-hidden rounded-[5px] border border-border bg-card shadow-sm">
      {showControls ? (
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <span>Show</span>
            <select
              className="rounded-[5px] border border-border bg-card px-2 py-1.5 text-sm text-slate-700 outline-none"
              onChange={(event) => {
                const value = Number(event.target.value);

                if (pagination?.onPageSizeChange) {
                  pagination.onPageSizeChange(value);
                  return;
                }

                setPageSize(value);
              }}
              value={activePageSize}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span>entries</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <span>Search:</span>
            <input
              className="w-full rounded-[5px] border border-border bg-card px-3 py-1.5 text-sm text-slate-700 outline-none sm:w-[220px]"
              onChange={(event) => {
                if (search) {
                  search.onChange(event.target.value);
                  return;
                }

                setSearchTerm(event.target.value);
              }}
              placeholder={searchPlaceholder}
              type="search"
              value={activeSearchTerm}
            />
          </label>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  className={[
                    "px-4 py-3 text-left text-sm font-semibold text-slate-700",
                    column.headerClassName ?? "",
                  ].join(" ")}
                  key={String(column.key)}
                  scope="col"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-sm text-muted"
                  colSpan={columns.length}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => {
                const derivedKey =
                  rowKey?.(row) ??
                  ("id" in row ? String(row.id) : `${String(columns[0]?.key)}-${index}`);

                return (
                  <tr className="transition hover:bg-slate-50" key={derivedKey}>
                    {columns.map((column) => (
                      <td
                        className={[
                          "px-4 py-3 align-middle text-slate-700",
                          column.className ?? "",
                        ].join(" ")}
                        key={String(column.key)}
                      >
                        {renderCellContent(row, column)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {showControls ? (
        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {totalEntries === 0 ? 0 : startIndex + 1} to {endIndex} of {totalEntries} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              className="rounded-[5px] border border-border bg-card px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={safeCurrentPage === 1}
              onClick={() => {
                if (pagination) {
                  pagination.onPageChange(Math.max(1, safeCurrentPage - 1));
                  return;
                }

                setCurrentPage((page) => Math.max(1, page - 1));
              }}
              type="button"
            >
              Previous
            </button>
            {paginationItems.map((page) => (
              <button
                className={[
                  "rounded-sm border px-3 py-1.5",
                  page === safeCurrentPage
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-card text-slate-700",
                ].join(" ")}
                key={page}
                onClick={() => {
                  if (pagination) {
                    pagination.onPageChange(page);
                    return;
                  }

                  setCurrentPage(page);
                }}
                type="button"
              >
                {page}
              </button>
            ))}
            <button
              className="rounded-[5px] border border-border bg-card px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={safeCurrentPage === totalPages || totalEntries === 0}
              onClick={() => {
                if (pagination) {
                  pagination.onPageChange(Math.min(totalPages, safeCurrentPage + 1));
                  return;
                }

                setCurrentPage((page) => Math.min(totalPages, page + 1));
              }}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
