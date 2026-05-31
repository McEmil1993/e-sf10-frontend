"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, UIEvent } from "react";
import AuthenticatedImage from "@/app/components/Image/AuthenticatedImage";
import Button from "@/app/components/Button/Button";
import LookupField from "@/app/components/Modal/LookupField";
import PagePlaceholder from "@/app/components/PagePlaceholder/PagePlaceholder";
import ToastViewport from "@/app/components/Toast/ToastViewport";
import rawBarangays from "@/app/data/barangays.json";
import rawCitiesMunicipalities from "@/app/data/cities-municipalities.json";
import rawProvinces from "@/app/data/provinces.json";
import rawRegions from "@/app/data/regions.json";
import type { ModalFieldOption } from "@/app/types/components/modalTypes";
import type { ToastItem } from "@/app/types/components/toastTypes";
import type {
  EmailSmtpSettings,
  EmailSmtpSettingsFormValues,
  EmailTemplate,
  EmailTemplateFormValues,
  EmailTemplateKey,
  ForgotPasswordMethod,
  PasswordRecoverySettings,
  PrincipalSettings,
  SchoolSettings,
  SchoolSettingsFormValues,
} from "@/app/types/systemTypes";
import type { AdminUser } from "@/app/types/userTypes";
import {
  activateEmailTemplate,
  createEmailTemplate,
  deleteEmailTemplate,
  getEmailSmtpSettings,
  getPasswordRecoverySettings,
  getPrincipalSettings,
  getSchoolSettings,
  listEmailTemplates,
  listPositions,
  listUsers,
  updateEmailSmtpSettings,
  updateEmailTemplate,
  updatePasswordRecoverySettings,
  updatePrincipalSettings,
  updateSchoolSettings,
  uploadFile,
} from "@/app/utils/api";
import { cacheSchoolBranding, toSchoolBranding } from "@/app/utils/schoolBranding";

const emptyFormValues: SchoolSettingsFormValues = {
  deped_school_id: "",
  school_name: "",
  school_email: "",
  school_number: "",
  district: "",
  division: "",
  region: "",
  province: "",
  municipality_city: "",
  barangay: "",
  sitio_purok: "",
  address: "",
  school_logo: "",
  deped_logo: "",
  other_logo: "",
};

const emptySmtpFormValues: EmailSmtpSettingsFormValues = {
  gmail_email: "",
  gmail_app_password: "",
  smtp_secure: false,
  is_enabled: false,
};

type LogoField = "school_logo" | "deped_logo" | "other_logo";

type PendingLogoFiles = Partial<Record<LogoField, File>>;

const logoFields: Array<{
  field: LogoField;
  label: string;
  filename: string;
}> = [
  { field: "school_logo", label: "School Logo", filename: "school-logo" },
  { field: "deped_logo", label: "DepEd Logo", filename: "deped-logo" },
  { field: "other_logo", label: "Other Logo", filename: "other-logo" },
];

const schoolSettingsUpdatedEvent = "school-settings-updated";

const emailTemplateTabs: Array<{ key: EmailTemplateKey; label: string }> = [
  { key: "password_recovery", label: "Password Recovery" },
  { key: "official_notices", label: "Official Notices" },
  { key: "otp", label: "OTP" },
];

const defaultTemplateContent: Record<EmailTemplateKey, string> = {
  password_recovery: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Temporary Password</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      font-family: Arial, sans-serif;
      color: #0f172a;
    }

    .wrapper {
      width: 100%;
      background: #f1f5f9;
    }

    .wrapper-cell {
      padding: 24px;
      text-align: center;
    }

    .card {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 12px 30px rgba(15,23,42,0.12);
    }

    .header {
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      padding: 30px;
      text-align: center;
    }

    .header h1 {
      margin: 0;
      font-size: 22px;
      color: #ffffff;
      letter-spacing: 1px;
    }

    .content {
      padding: 30px;
      text-align: center;
    }

    .content h2 {
      margin-bottom: 10px;
      font-size: 20px;
      color: #0f172a;
    }

    .content p {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
    }

    .temporary-password {
      display: inline-block;
      margin-top: 20px;
      padding: 14px 24px;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 2px;
    }

    .warning {
      margin-top: 20px;
      font-size: 13px;
      color: #b91c1c;
    }

    .footer {
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <table class="wrapper" role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td class="wrapper-cell" align="center">
        <div class="card">
          <div class="header">
            <h1>{{schoolName}}</h1>
          </div>
          <div class="content">
            <h2>Temporary Password</h2>
            <p>Hello {{recipientName}},</p>
            <p>We received a request to recover your account password.</p>
            <p>Use this temporary password to sign in:</p>
            <div class="temporary-password">{{temporaryPassword}}</div>
            <p class="warning">This temporary password expires in {{expiresIn}}. If it expires, request a new one from the Forgot Password page.</p>
          </div>
          <div class="footer">
            &copy; 2026 {{schoolName}}. All rights reserved.
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`,
  official_notices: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{noticeTitle}}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 24px; background: #f1f5f9; font-family: Arial, sans-serif; color: #0f172a; }
    .card { max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
    .header { padding: 24px; background: #0ea5e9; color: #ffffff; }
    .content { padding: 24px; line-height: 1.6; }
    .footer { padding: 16px 24px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>{{noticeTitle}}</h1>
      <p>{{schoolName}}</p>
    </div>
    <div class="content">
      {{noticeBody}}
    </div>
    <div class="footer">{{schoolEmail}} | {{schoolNumber}}</div>
  </div>
</body>
</html>`,
  otp: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>One-Time Password</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 24px; background: #f1f5f9; font-family: Arial, sans-serif; color: #0f172a; }
    .card { max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; text-align: center; box-shadow: 0 12px 30px rgba(15,23,42,0.12); }
    h1 { margin-top: 0; color: #0f172a; font-size: 24px; }
    p { color: #475569; font-size: 14px; line-height: 1.6; }
    .code { display: inline-block; margin: 20px 0; padding: 14px 22px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; color: #1d4ed8; font-size: 30px; letter-spacing: 8px; font-weight: bold; }
    .muted { color: #64748b; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>{{schoolName}}</h1>
    <p>Hello {{recipientName}}, your verification code is:</p>
    <div class="code">{{otpCode}}</div>
    <p class="muted">This code expires shortly. Do not share it with anyone.</p>
  </div>
</body>
</html>`,
};

const regions = rawRegions as Array<{ code: string; name: string; regionName: string }>;
const provinces = rawProvinces as Array<{ code: string; name: string; regionCode: string }>;
const citiesMunicipalities = rawCitiesMunicipalities as Array<{
  code: string;
  name: string;
  provinceCode: string;
  isCity: boolean;
  isMunicipality: boolean;
}>;
const barangays = rawBarangays as Array<{
  code: string;
  name: string;
  cityCode: string | false;
  municipalityCode: string | false;
}>;

const regionOptions: ModalFieldOption[] = regions.map((region) => ({
  label: `${region.regionName} - ${region.name}`,
  value: region.regionName,
}));

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected system settings request error.";
}

function createToast(toast: Omit<ToastItem, "id">): ToastItem {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    duration: 4500,
    ...toast,
  };
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    });
    reader.addEventListener("error", () => {
      reject(reader.error ?? new Error("Unable to read the selected logo."));
    });
    reader.readAsDataURL(file);
  });
}

function findRegionByValue(value: string) {
  const normalizedValue = value.trim().toLowerCase();

  return (
    regions.find((region) => {
      const regionName = region.regionName.toLowerCase();
      const name = region.name.toLowerCase();
      const label = `${region.regionName} - ${region.name}`.toLowerCase();

      return normalizedValue === regionName || normalizedValue === name || normalizedValue === label;
    }) ?? null
  );
}

function parseSchoolAddress(address: string, region: string) {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const selectedRegion = findRegionByValue(region);
  const provincePartIndex = parts.findIndex((part) =>
    provinces.some(
      (province) =>
        (!selectedRegion || province.regionCode === selectedRegion.code) &&
        part.toLowerCase().startsWith(province.name.toLowerCase()),
    ),
  );

  if (provincePartIndex < 0) {
    return {
      province: "",
      municipality_city: "",
      barangay: "",
      sitio_purok: address,
    };
  }

  const province =
    provinces.find(
      (currentProvince) =>
        (!selectedRegion || currentProvince.regionCode === selectedRegion.code) &&
        parts[provincePartIndex].toLowerCase().startsWith(currentProvince.name.toLowerCase()),
    )?.name ?? "";

  return {
    province,
    municipality_city: parts[provincePartIndex - 1] ?? "",
    barangay: parts[provincePartIndex - 2] ?? "",
    sitio_purok: parts.slice(0, Math.max(0, provincePartIndex - 2)).join(", "),
  };
}

function buildSchoolAddress(values: SchoolSettingsFormValues) {
  return [values.sitio_purok, values.barangay, values.municipality_city, values.province]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(", ");
}

function normalizeLookupText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function buildPrincipalOptions(
  users: AdminUser[],
  positions: Awaited<ReturnType<typeof listPositions>>,
  principalSettings: PrincipalSettings,
): ModalFieldOption[] {
  const schoolAdministrationPositions = new Set(
    positions
      .filter((position) => {
        const category = normalizeLookupText(position.category);
        const acronym = normalizeLookupText(position.acronym);
        const fullPosition = normalizeLookupText(position.fullPosition);

        return category === "school administration" || acronym.includes("principal") || fullPosition.includes("principal");
      })
      .flatMap((position) => [normalizeLookupText(position.acronym), normalizeLookupText(position.fullPosition)])
      .filter(Boolean),
  );
  const activePrincipalUserId = principalSettings.active_principal_user_id;

  return users
    .filter((user) => {
      if (user.status !== "active") {
        return false;
      }

      if (activePrincipalUserId !== null && user.id === activePrincipalUserId) {
        return true;
      }

      const userPosition = normalizeLookupText(user.position);
      return userPosition.includes("principal") || schoolAdministrationPositions.has(userPosition);
    })
    .map((user) => ({
      label: [user.name, user.position, user.email].filter(Boolean).join(" - "),
      value: String(user.id),
    }))
    .sort((firstOption, secondOption) => firstOption.label.localeCompare(secondOption.label));
}

function toFormValues(school: SchoolSettings): SchoolSettingsFormValues {
  const addressValues = parseSchoolAddress(school.address, school.region);

  return {
    deped_school_id: school.deped_school_id,
    school_name: school.school_name,
    school_email: school.school_email,
    school_number: school.school_number,
    district: school.district,
    division: school.division,
    region: findRegionByValue(school.region)?.regionName ?? school.region,
    ...addressValues,
    address: school.address,
    school_logo: school.school_logo,
    deped_logo: school.deped_logo,
    other_logo: school.other_logo,
  };
}

function toSmtpFormValues(settings: EmailSmtpSettings): EmailSmtpSettingsFormValues {
  return {
    gmail_email: settings.gmail_email,
    gmail_app_password: "",
    smtp_secure: settings.smtp_secure,
    is_enabled: settings.is_enabled,
  };
}

function createEmptyTemplateFormValues(templateKey: EmailTemplateKey): EmailTemplateFormValues {
  return {
    id: null,
    template_key: templateKey,
    template_name: "",
    subject: "",
    html_content: defaultTemplateContent[templateKey],
    is_active: false,
  };
}

function toTemplateFormValues(template: EmailTemplate): EmailTemplateFormValues {
  return {
    id: template.id,
    template_key: template.template_key,
    template_name: template.template_name,
    subject: template.subject,
    html_content: template.html_content,
    is_active: template.is_active,
  };
}

function SaveIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M5 3h12l2 2v16H5V3Zm2 2v5h9V5H7Zm1 9v5h8v-5H8Z" fill="currentColor" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M11 16V7.83L8.41 10.4 7 9l5-5 5 5-1.41 1.4L13 7.83V16h-2Zm-6 2h14v2H5v-2Z" fill="currentColor" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M6 7h12v2H6V7Zm2 4h8v2H8v-2Zm1 4h6v2H9v-2Z" fill="currentColor" />
    </svg>
  );
}

type LogoUploadSlotProps = {
  disabled: boolean;
  field: LogoField;
  label: string;
  previewUrl: string;
  value: string;
  onClear: (field: LogoField) => void;
  onSelect: (field: LogoField, file: File) => void;
};

function LogoUploadSlot({
  disabled,
  field,
  label,
  previewUrl,
  value,
  onClear,
  onSelect,
}: LogoUploadSlotProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const displaySrc = previewUrl || value;
  const uploadStatus = previewUrl ? "New logo selected" : value ? "Logo uploaded" : "No logo uploaded";

  return (
    <section className="rounded-[5px] border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{label}</h2>
          <p className="mt-1 text-xs text-muted">{uploadStatus}</p>
        </div>
      </div>

      <div className="mt-4 flex h-32 items-center justify-center rounded-[5px] border border-dashed border-border bg-white">
        {displaySrc ? (
          <AuthenticatedImage
            alt={label}
            className="max-h-24 max-w-[80%] object-contain"
            fallback={<span className="text-xs text-muted">Preview unavailable</span>}
            src={displaySrc}
          />
        ) : (
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Logo</span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          ref={inputRef}
          accept="image/*"
          className="hidden"
          disabled={disabled}
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) {
              onSelect(field, file);
            }

            event.currentTarget.value = "";
          }}
          type="file"
        />
        <Button
          disabled={disabled}
          icon={<UploadIcon />}
          onClick={() => inputRef.current?.click()}
          size="sm"
          type="button"
          variant="secondary"
        >
          Upload
        </Button>
        <Button
          className="border-rose-200 text-rose-700 hover:bg-rose-50"
          disabled={disabled || (!value && !previewUrl)}
          icon={<RemoveIcon />}
          onClick={() => onClear(field)}
          size="sm"
          type="button"
          variant="secondary"
        >
          Clear
        </Button>
      </div>
    </section>
  );
}

type HtmlCodeEditorProps = {
  disabled: boolean;
  onChange: (value: string) => void;
  value: string;
};

function tokenizeHtmlLine(line: string) {
  const tokenPattern = /(<!--.*?-->|<!DOCTYPE[^>]*>|<\/?[\w:-]+|\/?>|[\w:-]+(?=\=)|"[^"]*"|'[^']*'|\{\{[^}]+\}\})/gi;
  const tokens: Array<{ className: string; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ className: "text-slate-100", value: line.slice(lastIndex, match.index) });
    }

    const token = match[0];
    let className = "text-slate-100";

    if (token.startsWith("<!--")) {
      className = "text-slate-500";
    } else if (/^<!DOCTYPE/i.test(token)) {
      className = "text-fuchsia-300";
    } else if (token.startsWith("{{")) {
      className = "text-amber-300";
    } else if (token.startsWith("\"") || token.startsWith("'")) {
      className = "text-orange-300";
    } else if (token === ">" || token === "/>") {
      className = "text-slate-400";
    } else if (token.startsWith("<")) {
      className = "text-sky-300";
    } else {
      className = "text-emerald-300";
    }

    tokens.push({ className, value: token });
    lastIndex = tokenPattern.lastIndex;
  }

  if (lastIndex < line.length) {
    tokens.push({ className: "text-slate-100", value: line.slice(lastIndex) });
  }

  return tokens;
}

function HtmlCodeEditor({ disabled, onChange, value }: HtmlCodeEditorProps) {
  const lineNumbers = value.split("\n").map((_, index) => index + 1);
  const lines = value.split("\n");
  const [scrollPosition, setScrollPosition] = useState({ left: 0, top: 0 });

  function handleEditorScroll(event: UIEvent<HTMLTextAreaElement>) {
    setScrollPosition({
      left: event.currentTarget.scrollLeft,
      top: event.currentTarget.scrollTop,
    });
  }

  return (
    <div className="overflow-hidden rounded-[5px] border border-slate-700 bg-[#1e1e1e] shadow-inner">
      <div className="flex items-center gap-2 border-b border-slate-700 bg-[#252526] px-3 py-2">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-xs font-semibold text-slate-300">template.html</span>
      </div>
      <div className="grid h-[560px] grid-cols-[56px_1fr] overflow-hidden">
        <div className="select-none overflow-hidden border-r border-slate-700 bg-[#1b1b1b] px-3 py-3 text-right font-mono text-sm leading-6 text-slate-500">
          <div style={{ transform: `translateY(-${scrollPosition.top}px)` }}>
            {lineNumbers.map((lineNumber) => (
              <div className="h-6" key={lineNumber}>{lineNumber}</div>
            ))}
          </div>
        </div>
        <div className="relative overflow-hidden">
          <pre
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre px-4 py-3 font-mono text-sm leading-6"
          >
            <code
              className="block min-w-max"
              style={{
                transform: `translate(${-scrollPosition.left}px, ${-scrollPosition.top}px)`,
              }}
            >
              {lines.map((line, lineIndex) => (
                <span className="block h-6" key={`${lineIndex}-${line}`}>
                  {tokenizeHtmlLine(line).map((token, tokenIndex) => (
                    <span className={token.className} key={`${tokenIndex}-${token.value}`}>
                      {token.value}
                    </span>
                  ))}
                  {"\n"}
                </span>
              ))}
            </code>
          </pre>
          <textarea
            className="absolute inset-0 h-full w-full resize-none overflow-auto border-0 bg-transparent px-4 py-3 font-mono text-sm leading-6 text-transparent caret-white outline-none selection:bg-sky-500/40 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            onScroll={handleEditorScroll}
            spellCheck={false}
            value={value}
            wrap="off"
          />
        </div>
      </div>
    </div>
  );
}

export default function SystemSettingsPage() {
  const [school, setSchool] = useState<SchoolSettings | null>(null);
  const [formValues, setFormValues] = useState<SchoolSettingsFormValues>(emptyFormValues);
  const [smtpSettings, setSmtpSettings] = useState<EmailSmtpSettings | null>(null);
  const [smtpFormValues, setSmtpFormValues] = useState<EmailSmtpSettingsFormValues>(emptySmtpFormValues);
  const [passwordRecoverySettings, setPasswordRecoverySettings] = useState<PasswordRecoverySettings>({
    forgot_password_method: "temporary_password",
  });
  const [principalSettings, setPrincipalSettings] = useState<PrincipalSettings>({
    active_principal_user_id: null,
    active_principal_name: null,
    active_principal_email: null,
    active_principal_position: null,
  });
  const [principalUserId, setPrincipalUserId] = useState("");
  const [principalOptions, setPrincipalOptions] = useState<ModalFieldOption[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [activeTemplateKey, setActiveTemplateKey] = useState<EmailTemplateKey>("password_recovery");
  const [templateFormValues, setTemplateFormValues] = useState<EmailTemplateFormValues>(
    createEmptyTemplateFormValues("password_recovery"),
  );
  const [pendingLogoFiles, setPendingLogoFiles] = useState<PendingLogoFiles>({});
  const [previewUrls, setPreviewUrls] = useState<Partial<Record<LogoField, string>>>({});
  const previewUrlsRef = useRef<Partial<Record<LogoField, string>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [isSavingPasswordRecovery, setIsSavingPasswordRecovery] = useState(false);
  const [isSavingPrincipal, setIsSavingPrincipal] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const lastUpdatedLabel = useMemo(() => {
    if (!school?.updated_at) {
      return "";
    }

    return new Intl.DateTimeFormat("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(school.updated_at));
  }, [school?.updated_at]);

  const selectedRegion = useMemo(() => findRegionByValue(formValues.region), [formValues.region]);

  const provinceOptions = useMemo(
    () =>
      provinces
        .filter((province) => !selectedRegion || province.regionCode === selectedRegion.code)
        .map((province) => ({
          label: province.name,
          value: province.name,
        })),
    [selectedRegion],
  );

  const selectedProvince = useMemo(
    () =>
      provinces.find(
        (province) =>
          province.name === formValues.province &&
          (!selectedRegion || province.regionCode === selectedRegion.code),
      ) ?? null,
    [formValues.province, selectedRegion],
  );

  const cityMunicipalityOptions = useMemo(
    () =>
      citiesMunicipalities
        .filter((cityMunicipality) => !selectedProvince || cityMunicipality.provinceCode === selectedProvince.code)
        .map((cityMunicipality) => ({
          label: cityMunicipality.name,
          value: cityMunicipality.name,
        })),
    [selectedProvince],
  );

  const selectedCityMunicipality = useMemo(
    () =>
      citiesMunicipalities.find(
        (cityMunicipality) =>
          cityMunicipality.name === formValues.municipality_city &&
          (!selectedProvince || cityMunicipality.provinceCode === selectedProvince.code),
      ) ?? null,
    [formValues.municipality_city, selectedProvince],
  );

  const barangayOptions = useMemo(
    () =>
      barangays
        .filter((barangay) => {
          if (!selectedCityMunicipality) {
            return false;
          }

          return (
            barangay.cityCode === selectedCityMunicipality.code ||
            barangay.municipalityCode === selectedCityMunicipality.code
          );
        })
        .map((barangay) => ({
          label: barangay.name,
          value: barangay.name,
        })),
    [selectedCityMunicipality],
  );

  useEffect(() => {
    async function loadSchoolSettings() {
      setIsLoading(true);

      try {
        const [
          schoolResponse,
          smtpResponse,
          passwordRecoveryResponse,
          principalResponse,
          templateResponse,
          userResponse,
          positionResponse,
        ] = await Promise.all([
          getSchoolSettings(),
          getEmailSmtpSettings(),
          getPasswordRecoverySettings(),
          getPrincipalSettings(),
          listEmailTemplates(),
          listUsers(),
          listPositions(),
        ]);
        setSchool(schoolResponse);
        setFormValues(toFormValues(schoolResponse));
        setSmtpSettings(smtpResponse);
        setSmtpFormValues(toSmtpFormValues(smtpResponse));
        setPasswordRecoverySettings(passwordRecoveryResponse);
        setPrincipalSettings(principalResponse);
        setPrincipalUserId(principalResponse.active_principal_user_id ? String(principalResponse.active_principal_user_id) : "");
        setPrincipalOptions(buildPrincipalOptions(userResponse, positionResponse, principalResponse));
        setEmailTemplates(templateResponse);
      } catch (error) {
        showToast({
          title: "Unable to load system settings",
          description: getErrorMessage(error),
          tone: "error",
        });
      } finally {
        setIsLoading(false);
      }
    }

    void loadSchoolSettings();
  }, []);

  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  useEffect(() => {
    return () => {
      Object.values(previewUrlsRef.current).forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  function showToast(toast: Omit<ToastItem, "id">) {
    setToasts((currentValue) => [...currentValue, createToast(toast)]);
  }

  function dismissToast(toastId: string) {
    setToasts((currentValue) => currentValue.filter((toast) => toast.id !== toastId));
  }

  function updateField(field: keyof SchoolSettingsFormValues, value: string) {
    setFormValues((currentValue) => ({
      ...currentValue,
      [field]: value,
    }));
  }

  function updateAddressField(field: "region" | "province" | "municipality_city" | "barangay" | "sitio_purok", value: string) {
    setFormValues((currentValue) => {
      const nextValue = {
        ...currentValue,
        [field]: value,
      };

      if (field === "region") {
        nextValue.province = value === "Region VII" ? "Bohol" : "";
        nextValue.municipality_city = "";
        nextValue.barangay = "";
      }

      if (field === "province") {
        nextValue.municipality_city = "";
        nextValue.barangay = "";
      }

      if (field === "municipality_city") {
        nextValue.barangay = "";
      }

      nextValue.address = buildSchoolAddress(nextValue);

      return nextValue;
    });
  }

  function updateSmtpField(field: keyof EmailSmtpSettingsFormValues, value: string | boolean) {
    setSmtpFormValues((currentValue) => ({
      ...currentValue,
      [field]: value,
    }));
  }

  function updateTemplateField(field: keyof EmailTemplateFormValues, value: string | boolean) {
    setTemplateFormValues((currentValue) => ({
      ...currentValue,
      [field]: value,
    }));
  }

  function selectTemplateTab(templateKey: EmailTemplateKey) {
    setActiveTemplateKey(templateKey);
    setTemplateFormValues(createEmptyTemplateFormValues(templateKey));
  }

  function selectTemplate(template: EmailTemplate) {
    setActiveTemplateKey(template.template_key);
    setTemplateFormValues(toTemplateFormValues(template));
  }

  function handleLogoSelect(field: LogoField, file: File) {
    setPendingLogoFiles((currentValue) => ({
      ...currentValue,
      [field]: file,
    }));
    setPreviewUrls((currentValue) => {
      const previousUrl = currentValue[field];

      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }

      return {
        ...currentValue,
        [field]: URL.createObjectURL(file),
      };
    });
  }

  function handleLogoClear(field: LogoField) {
    setPendingLogoFiles((currentValue) => {
      const nextValue = { ...currentValue };
      delete nextValue[field];
      return nextValue;
    });
    setPreviewUrls((currentValue) => {
      const previousUrl = currentValue[field];

      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }

      const nextValue = { ...currentValue };
      delete nextValue[field];
      return nextValue;
    });
    updateField(field, "");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const nextValues: SchoolSettingsFormValues = {
        ...formValues,
        address: buildSchoolAddress(formValues),
      };

      for (const logoField of logoFields) {
        const file = pendingLogoFiles[logoField.field];

        if (file) {
          const uploadedFile = await uploadFile(file);
          nextValues[logoField.field] = uploadedFile.relativeUrl;
        }
      }

      const updatedSchool = await updateSchoolSettings(nextValues);
      setSchool(updatedSchool);
      setFormValues(toFormValues(updatedSchool));
      const updatedBranding = toSchoolBranding(updatedSchool);
      const selectedSchoolLogo = pendingLogoFiles.school_logo;

      if (updatedBranding && selectedSchoolLogo) {
        cacheSchoolBranding({
          ...updatedBranding,
          schoolLogo: await fileToDataUrl(selectedSchoolLogo),
        });
      } else {
        cacheSchoolBranding(updatedBranding);
      }
      window.dispatchEvent(new CustomEvent(schoolSettingsUpdatedEvent, { detail: updatedSchool }));
      setPendingLogoFiles({});
      setPreviewUrls((currentValue) => {
        Object.values(currentValue).forEach((url) => {
          if (url) {
            URL.revokeObjectURL(url);
          }
        });

        return {};
      });
      showToast({
        title: "System settings saved",
        description: "School profile and logos are now updated.",
        tone: "success",
      });
    } catch (error) {
      showToast({
        title: "Unable to save system settings",
        description: getErrorMessage(error),
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSmtpSave() {
    setIsSavingSmtp(true);

    try {
      const updatedSettings = await updateEmailSmtpSettings({
        ...smtpFormValues,
        gmail_app_password: smtpFormValues.gmail_app_password.trim(),
      });
      setSmtpSettings(updatedSettings);
      setSmtpFormValues(toSmtpFormValues(updatedSettings));
      showToast({
        title: "SMTP settings saved",
        description: "Gmail SMTP settings are now updated.",
        tone: "success",
      });
    } catch (error) {
      showToast({
        title: "Unable to save SMTP settings",
        description: getErrorMessage(error),
        tone: "error",
      });
    } finally {
      setIsSavingSmtp(false);
    }
  }

  async function handlePasswordRecoveryMethodChange(forgotPasswordMethod: ForgotPasswordMethod) {
    setIsSavingPasswordRecovery(true);

    try {
      const updatedSettings = await updatePasswordRecoverySettings(forgotPasswordMethod);
      setPasswordRecoverySettings(updatedSettings);
      showToast({
        title: "Password recovery saved",
        description: "Forgot password method is now updated.",
        tone: "success",
      });
    } catch (error) {
      showToast({
        title: "Unable to save password recovery",
        description: getErrorMessage(error),
        tone: "error",
      });
    } finally {
      setIsSavingPasswordRecovery(false);
    }
  }

  async function handlePrincipalSave() {
    const selectedPrincipalUserId = principalUserId.trim() ? Number(principalUserId) : null;

    if (
      selectedPrincipalUserId !== null &&
      (!Number.isInteger(selectedPrincipalUserId) || selectedPrincipalUserId <= 0)
    ) {
      showToast({
        title: "Select a valid principal",
        description: "Choose a principal from the lookup list.",
        tone: "error",
      });
      return;
    }

    setIsSavingPrincipal(true);

    try {
      const updatedSettings = await updatePrincipalSettings(selectedPrincipalUserId);
      setPrincipalSettings(updatedSettings);
      setPrincipalUserId(updatedSettings.active_principal_user_id ? String(updatedSettings.active_principal_user_id) : "");
      showToast({
        title: "Principal setting updated",
        description: updatedSettings.active_principal_name
          ? `${updatedSettings.active_principal_name} is now the active principal.`
          : "No active principal is selected.",
        tone: "success",
      });
    } catch (error) {
      showToast({
        title: "Unable to save principal setting",
        description: getErrorMessage(error),
        tone: "error",
      });
    } finally {
      setIsSavingPrincipal(false);
    }
  }

  async function refreshTemplates(templateKey = activeTemplateKey) {
    const templates = await listEmailTemplates();
    setEmailTemplates(templates);
    setTemplateFormValues(createEmptyTemplateFormValues(templateKey));
  }

  async function handleTemplateSave() {
    setIsSavingTemplate(true);

    try {
      if (templateFormValues.id) {
        await updateEmailTemplate(templateFormValues.id, templateFormValues);
      } else {
        await createEmailTemplate(templateFormValues);
      }

      await refreshTemplates(templateFormValues.template_key);
      showToast({
        title: "Email template saved",
        description: "Template settings are now updated.",
        tone: "success",
      });
    } catch (error) {
      showToast({
        title: "Unable to save email template",
        description: getErrorMessage(error),
        tone: "error",
      });
    } finally {
      setIsSavingTemplate(false);
    }
  }

  async function handleTemplateActivate(template: EmailTemplate) {
    setIsSavingTemplate(true);

    try {
      await activateEmailTemplate(template.id);
      const templates = await listEmailTemplates();
      setEmailTemplates(templates);
      setTemplateFormValues(toTemplateFormValues({
        ...template,
        is_active: true,
      }));
      showToast({
        title: "Email template activated",
        description: "This template will be used for its email type.",
        tone: "success",
      });
    } catch (error) {
      showToast({
        title: "Unable to activate template",
        description: getErrorMessage(error),
        tone: "error",
      });
    } finally {
      setIsSavingTemplate(false);
    }
  }

  async function handleTemplateDelete(template: EmailTemplate) {
    setIsSavingTemplate(true);

    try {
      await deleteEmailTemplate(template.id);
      await refreshTemplates(template.template_key);
      showToast({
        title: "Email template deleted",
        description: "Template is no longer available.",
        tone: "success",
      });
    } catch (error) {
      showToast({
        title: "Unable to delete template",
        description: getErrorMessage(error),
        tone: "error",
      });
    } finally {
      setIsSavingTemplate(false);
    }
  }

  const isBusy = isLoading || isSaving;
  const isPrincipalSettingsBusy = isLoading || isSavingPrincipal;
  const isEmailSettingsBusy = isLoading || isSavingSmtp || isSavingPasswordRecovery || isSavingTemplate;
  const activeTemplates = emailTemplates.filter((template) => template.template_key === activeTemplateKey);

  return (
    <PagePlaceholder
      breadcrumb="Home > Settings > System"
      contentClassName="space-y-5"
      sectionLabel="School profile and official logos"
      title="System Settings"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <section className="rounded-[5px] border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">School Information</h2>
              {lastUpdatedLabel ? <p className="mt-1 text-sm text-muted">Last updated {lastUpdatedLabel}</p> : null}
            </div>
            <Button disabled={isBusy} icon={<SaveIcon />} type="submit">
              {isSaving ? "Saving" : "Save Changes"}
            </Button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">DepEd School ID</span>
              <input
                className="h-10 w-full rounded-[5px] border border-border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-primary"
                disabled={isBusy}
                onChange={(event) => updateField("deped_school_id", event.target.value)}
                required
                value={formValues.deped_school_id}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">School Name</span>
              <input
                className="h-10 w-full rounded-[5px] border border-border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-primary"
                disabled={isBusy}
                onChange={(event) => updateField("school_name", event.target.value)}
                required
                value={formValues.school_name}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">School Email</span>
              <input
                className="h-10 w-full rounded-[5px] border border-border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-primary"
                disabled={isBusy}
                onChange={(event) => updateField("school_email", event.target.value)}
                placeholder="school@gmail.com"
                type="email"
                value={formValues.school_email}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">School Number</span>
              <input
                className="h-10 w-full rounded-[5px] border border-border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-primary"
                disabled={isBusy}
                onChange={(event) => updateField("school_number", event.target.value)}
                placeholder="Telephone or mobile number"
                value={formValues.school_number}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">District</span>
              <input
                className="h-10 w-full rounded-[5px] border border-border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-primary"
                disabled={isBusy}
                onChange={(event) => updateField("district", event.target.value)}
                required
                value={formValues.district}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Division</span>
              <input
                className="h-10 w-full rounded-[5px] border border-border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-primary"
                disabled={isBusy}
                onChange={(event) => updateField("division", event.target.value)}
                required
                value={formValues.division}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Region</span>
              <LookupField
                disabled={isBusy}
                onChange={(value) => updateAddressField("region", value)}
                options={regionOptions}
                placeholder="Region VII"
                value={formValues.region}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Province</span>
              <LookupField
                disabled={isBusy}
                onChange={(value) => updateAddressField("province", value)}
                options={provinceOptions}
                placeholder="Bohol"
                value={formValues.province}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Municipality / City</span>
              <LookupField
                disabled={isBusy}
                onChange={(value) => updateAddressField("municipality_city", value)}
                options={cityMunicipalityOptions}
                placeholder="Trinidad"
                value={formValues.municipality_city}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Barangay</span>
              <LookupField
                disabled={isBusy}
                onChange={(value) => updateAddressField("barangay", value)}
                options={barangayOptions}
                placeholder="Poblacion"
                value={formValues.barangay}
              />
            </label>

            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Sitio/Purok</span>
              <input
                className="h-10 w-full rounded-[5px] border border-border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-primary"
                disabled={isBusy}
                onChange={(event) => updateAddressField("sitio_purok", event.target.value)}
                placeholder="Purok 1"
                value={formValues.sitio_purok}
              />
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Official Logos</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {logoFields.map((logoField) => (
              <LogoUploadSlot
                key={logoField.field}
                disabled={isBusy}
                field={logoField.field}
                label={logoField.label}
                onClear={handleLogoClear}
                onSelect={handleLogoSelect}
                previewUrl={previewUrls[logoField.field] ?? ""}
                value={formValues[logoField.field]}
              />
            ))}
          </div>
        </section>

        <section className="rounded-[5px] border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Principal Settings</h2>
              <p className="mt-1 text-sm text-muted">Select the active principal used for official school records.</p>
            </div>
            <Button disabled={isPrincipalSettingsBusy} onClick={handlePrincipalSave} type="button">
              {isSavingPrincipal ? "Saving" : "Save Principal"}
            </Button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Active Principal</span>
              <LookupField
                disabled={isPrincipalSettingsBusy}
                onChange={setPrincipalUserId}
                options={principalOptions}
                placeholder="Search principal or school administrator"
                value={principalUserId}
              />
            </label>

            <div className="rounded-[5px] border border-border bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Current Principal</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">
                {principalSettings.active_principal_name ?? "-"}
              </p>
              {principalSettings.active_principal_position || principalSettings.active_principal_email ? (
                <p className="mt-1 text-xs text-muted">
                  {[principalSettings.active_principal_position, principalSettings.active_principal_email]
                    .filter(Boolean)
                    .join(" - ")}
                </p>
              ) : null}
            </div>
          </div>

          {principalOptions.length === 0 ? (
            <p className="mt-3 text-sm text-amber-700">
              No active principal or school administrator user found. Add or update a user position first.
            </p>
          ) : null}
        </section>

        <section className="rounded-[5px] border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Gmail SMTP Settings</h2>
              <p className="mt-1 text-sm text-muted">Stored in database. Use a Gmail App Password.</p>
            </div>
            <Button disabled={isEmailSettingsBusy} onClick={handleSmtpSave} type="button">
              {isSavingSmtp ? "Saving" : "Save SMTP"}
            </Button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Gmail Email</span>
              <input
                className="h-10 w-full rounded-[5px] border border-border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-primary"
                disabled={isEmailSettingsBusy}
                onChange={(event) => updateSmtpField("gmail_email", event.target.value)}
                placeholder="school@gmail.com"
                type="email"
                value={smtpFormValues.gmail_email}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Gmail App Password</span>
              <input
                className="h-10 w-full rounded-[5px] border border-border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-primary"
                disabled={isEmailSettingsBusy}
                onChange={(event) => updateSmtpField("gmail_app_password", event.target.value)}
                placeholder={smtpSettings?.has_gmail_app_password ? "Saved password hidden" : "16-character app password"}
                type="password"
                value={smtpFormValues.gmail_app_password}
              />
            </label>

            <div className="rounded-[5px] border border-border bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Host: <span className="font-semibold">smtp.gmail.com</span>
            </div>
            <div className="rounded-[5px] border border-border bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Port: <span className="font-semibold">587</span>
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                checked={smtpFormValues.smtp_secure}
                disabled={isEmailSettingsBusy}
                onChange={(event) => updateSmtpField("smtp_secure", event.target.checked)}
                type="checkbox"
              />
              Use secure SMTP
            </label>

            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                checked={smtpFormValues.is_enabled}
                disabled={isEmailSettingsBusy}
                onChange={(event) => updateSmtpField("is_enabled", event.target.checked)}
                type="checkbox"
              />
              Enable email sending
            </label>
          </div>
        </section>

        <section className="rounded-[5px] border border-border bg-card p-5 shadow-sm">
          <div className="border-b border-border pb-4">
            <h2 className="text-lg font-semibold text-slate-900">Forgot Password Method</h2>
            <p className="mt-1 text-sm text-muted">Choose what users receive from the Forgot Password page.</p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              {
                value: "temporary_password" as const,
                label: "Temporary Password",
                description: "Email a temporary password that expires in 1 hour.",
              },
              {
                value: "otp_email" as const,
                label: "OTP via Email",
                description: "Email a 6-digit OTP that expires in 2 minutes.",
              },
            ].map((option) => {
              const isChecked = passwordRecoverySettings.forgot_password_method === option.value;

              return (
                <label
                  className={[
                    "flex cursor-pointer gap-3 rounded-[5px] border p-4 transition",
                    isChecked
                      ? "border-primary bg-sky-50"
                      : "border-border bg-white hover:bg-slate-50",
                    isEmailSettingsBusy ? "cursor-not-allowed opacity-70" : "",
                  ].join(" ")}
                  key={option.value}
                >
                  <input
                    checked={isChecked}
                    className="mt-1"
                    disabled={isEmailSettingsBusy}
                    name="forgotPasswordMethod"
                    onChange={() => handlePasswordRecoveryMethodChange(option.value)}
                    type="radio"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{option.label}</span>
                    <span className="mt-1 block text-sm text-muted">{option.description}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        <section className="rounded-[5px] border border-border bg-card p-5 shadow-sm">
          <div className="border-b border-border pb-4">
            <h2 className="text-lg font-semibold text-slate-900">Email Templates</h2>
            <p className="mt-1 text-sm text-muted">
              Choose the active HTML template for each email type.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {emailTemplateTabs.map((tab) => (
              <button
                className={[
                  "rounded-[5px] border px-3 py-2 text-sm font-semibold transition",
                  activeTemplateKey === tab.key
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
                disabled={isEmailSettingsBusy}
                key={tab.key}
                onClick={() => selectTemplateTab(tab.key)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[360px_1fr]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Saved Templates</h3>
                <Button
                  disabled={isEmailSettingsBusy}
                  onClick={() => setTemplateFormValues(createEmptyTemplateFormValues(activeTemplateKey))}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  New
                </Button>
              </div>

              {activeTemplates.length > 0 ? (
                <div className="space-y-2">
                  {activeTemplates.map((template) => (
                    <div
                      className="rounded-[5px] border border-border bg-white p-3"
                      key={template.id}
                    >
                      <button
                        className="block w-full text-left"
                        disabled={isEmailSettingsBusy}
                        onClick={() => selectTemplate(template)}
                        type="button"
                      >
                        <p className="truncate text-sm font-semibold text-slate-900">{template.template_name}</p>
                        <p className="mt-1 truncate text-xs text-muted">{template.subject}</p>
                      </button>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          disabled={isEmailSettingsBusy || template.is_active}
                          onClick={() => handleTemplateActivate(template)}
                          size="sm"
                          type="button"
                          variant="secondary"
                        >
                          {template.is_active ? "Active" : "Use"}
                        </Button>
                        <Button
                          className="border-rose-200 text-rose-700 hover:bg-rose-50"
                          disabled={isEmailSettingsBusy}
                          onClick={() => handleTemplateDelete(template)}
                          size="sm"
                          type="button"
                          variant="secondary"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[5px] border border-dashed border-border bg-slate-50 px-3 py-6 text-center text-sm text-muted">
                  No templates saved for this type.
                </div>
              )}
            </div>

            <div className="space-y-4 rounded-[5px] border border-border bg-slate-50 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700">Template Name</span>
                  <input
                    className="h-10 w-full rounded-[5px] border border-border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-primary"
                    disabled={isEmailSettingsBusy}
                    onChange={(event) => updateTemplateField("template_name", event.target.value)}
                    value={templateFormValues.template_name}
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700">Subject</span>
                  <input
                    className="h-10 w-full rounded-[5px] border border-border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-primary"
                    disabled={isEmailSettingsBusy}
                    onChange={(event) => updateTemplateField("subject", event.target.value)}
                    value={templateFormValues.subject}
                  />
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-700">HTML Template</span>
                <HtmlCodeEditor
                  disabled={isEmailSettingsBusy}
                  onChange={(value) => updateTemplateField("html_content", value)}
                  value={templateFormValues.html_content}
                />
              </label>

              <div className="rounded-[5px] border border-border bg-white p-3">
                <h3 className="text-sm font-semibold text-slate-900">Preview</h3>
                <iframe
                  className="mt-3 h-96 w-full rounded-[5px] border border-border bg-white"
                  sandbox=""
                  srcDoc={templateFormValues.html_content}
                  title="Email template preview"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    checked={templateFormValues.is_active}
                    disabled={isEmailSettingsBusy}
                    onChange={(event) => updateTemplateField("is_active", event.target.checked)}
                    type="checkbox"
                  />
                  Make active after save
                </label>
                <Button disabled={isEmailSettingsBusy} onClick={handleTemplateSave} type="button">
                  {isSavingTemplate ? "Saving" : "Save Template"}
                </Button>
              </div>

              <p className="text-xs text-muted">
                You can save a complete HTML document starting with {"<!DOCTYPE html>"} and include CSS in {"<style>"} tags. Placeholders: {"{{schoolName}}"}, {"{{schoolEmail}}"}, {"{{schoolNumber}}"}, {"{{recipientName}}"}, {"{{temporaryPassword}}"}, {"{{expiresIn}}"}, {"{{otpCode}}"}, {"{{noticeTitle}}"}, {"{{noticeBody}}"}
              </p>
            </div>
          </div>
        </section>
      </form>

      <ToastViewport onDismiss={dismissToast} toasts={toasts} />
    </PagePlaceholder>
  );
}
