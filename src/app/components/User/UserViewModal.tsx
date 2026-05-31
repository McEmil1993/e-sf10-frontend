"use client";

import AuthenticatedImage from "@/app/components/Image/AuthenticatedImage";
import { EditIcon } from "@/app/components/Icon/UserActionIcons";
import ViewDetailsModal, {
  type ViewDetailsFieldItem,
  type ViewDetailsSectionItem,
} from "@/app/components/Modal/ViewDetailsModal";
import { buildRoleToneMap, formatDate, getStatusTone } from "@/app/lib/display";
import type { AdminUser } from "@/app/types/userTypes";

type UserViewModalProps = {
  isOpen: boolean;
  title?: string;
  user: AdminUser | null;
  basicInformationExtraFields?: ViewDetailsFieldItem[];
  detailSectionsAfterBasic?: ViewDetailsSectionItem[];
  sidebarInfoItems?: ViewDetailsFieldItem[] | null;
  sidebarInfoTitle?: string;
  onClose: () => void;
  onEdit?: (userId: number) => void;
};

function formatLabel(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function displayValue(value: string | null | undefined) {
  return value?.trim() || "-";
}

function formatAddress(user: AdminUser) {
  const streetAddress = user.address?.trim() ?? "";
  const barangay = user.barangay?.trim() ?? "";
  const municipalityCity = user.municipality_city?.trim() ?? "";
  const province = user.province?.trim() ?? "";
  const localAddress = [streetAddress, barangay, municipalityCity].filter(Boolean).join(" ");

  if (localAddress && province) {
    return `${localAddress}, ${province}`;
  }

  return localAddress || province || "-";
}

function safeFormatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return formatDate(value);
}

function EditSectionButton({ onClick }: { onClick?: () => void }) {
  if (!onClick) {
    return null;
  }

  return (
    <button
      className="inline-flex h-8 w-8 items-center justify-center rounded-[5px] bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
      onClick={onClick}
      title="Edit"
      type="button"
    >
      <EditIcon />
    </button>
  );
}

function UserAvatarPreview({ user }: { user: AdminUser }) {
  const imagePath = user.avatar ?? user.profile_picture ?? "";

  return (
    <AuthenticatedImage
      alt={user.name}
      className="h-[102px] w-[102px] rounded-[4px] object-cover"
      fallback={
        <div className="flex h-[102px] w-[102px] items-center justify-center rounded-[4px] bg-slate-200 text-3xl font-semibold text-slate-600">
          {user.name.trim().charAt(0).toUpperCase() || "?"}
        </div>
      }
      src={imagePath}
    />
  );
}

function UserProfileSidebar({
  onEdit,
  sidebarInfoItems,
  sidebarInfoTitle = "Account",
  user,
}: {
  user: AdminUser;
  sidebarInfoItems?: ViewDetailsFieldItem[] | null;
  sidebarInfoTitle?: string;
  onEdit?: () => void;
}) {
  const roles = user.roles.length > 0 ? user.roles : ["user"];
  const roleToneMap = buildRoleToneMap(roles);
  const statusTone = getStatusTone(user.status);
  const infoItems = sidebarInfoItems === null ? [] : sidebarInfoItems ?? [
    { label: "Username", value: displayValue(user.username) },
    { label: "Email", value: displayValue(user.email), valueClassName: "break-words" },
    { label: "Joined", value: safeFormatDate(user.created_at) },
  ];

  return (
    <section className="overflow-hidden rounded-[5px] border border-border bg-card shadow-sm">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Profile Overview</p>
            <h3 className="mt-3 text-base font-semibold text-slate-950">Personal Card</h3>
          </div>
          {onEdit ? (
            <button
              className="inline-flex h-8 items-center gap-2 rounded-[5px] border border-border bg-card px-3 text-xs font-semibold text-slate-700 transition hover:border-primary/40 hover:text-primary"
              onClick={onEdit}
              type="button"
            >
              <EditIcon />
              Edit
            </button>
          ) : null}
        </div>

        <div className="mt-6">
          <UserAvatarPreview user={user} />
        </div>

        <div className="mt-5">
          <h2 className="text-xl font-semibold leading-tight text-slate-950">{displayValue(user.name)}</h2>
          <p className="mt-1 text-sm text-muted">{displayValue(user.position)}</p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {roles.map((role) => (
            <span
              className={[
                "inline-flex rounded px-2.5 py-1 text-xs font-semibold",
                roleToneMap[role.trim().toLowerCase()] ?? "bg-slate-100 text-slate-700",
              ].join(" ")}
              key={role}
            >
              {formatLabel(role)}
            </span>
          ))}
        </div>

        <div className="mt-4">
          <span className={["inline-flex rounded px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", statusTone].join(" ")}>
            {formatLabel(user.status)}
          </span>
        </div>
      </div>

      {infoItems.length > 0 ? (
        <div className="border-t border-border bg-slate-50 p-5">
          <div className="rounded-[5px] border border-border bg-slate-100 p-4">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">{sidebarInfoTitle}</p>
            <div className="space-y-4">
              {infoItems.map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">{item.label}</p>
                  <div className={["mt-2 text-sm font-semibold text-slate-950", item.valueClassName ?? ""].join(" ")}>
                    {item.value || "-"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default function UserViewModal({
  basicInformationExtraFields,
  detailSectionsAfterBasic,
  isOpen,
  onClose,
  onEdit,
  sidebarInfoItems,
  sidebarInfoTitle,
  title = "View User",
  user,
}: UserViewModalProps) {
  if (!user) {
    return null;
  }

  const handleEdit = onEdit ? () => onEdit(user.id) : undefined;

  const sections: ViewDetailsSectionItem[] = [
    {
      title: "Basic Information",
      action: <EditSectionButton onClick={handleEdit} />,
      columns: 2,
      fields: [
        { label: "Sex", value: formatLabel(displayValue(user.sex)) },
        { label: "Email", value: displayValue(user.email), valueClassName: "break-words" },
        { label: "Contact Number", value: displayValue(user.contact_number) },
        ...(basicInformationExtraFields ?? [
          { label: "Address", value: formatAddress(user), colSpan: "full" as const },
        ]),
      ],
    },
    ...(detailSectionsAfterBasic ?? []),
  ];

  return (
    <ViewDetailsModal
      isOpen={isOpen}
      onClose={onClose}
      sections={sections}
      sidebar={
        <UserProfileSidebar
          onEdit={handleEdit}
          sidebarInfoItems={sidebarInfoItems}
          sidebarInfoTitle={sidebarInfoTitle}
          user={user}
        />
      }
      title={title}
    />
  );
}
