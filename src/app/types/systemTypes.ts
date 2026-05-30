export type SchoolSettings = {
  school_id: number;
  deped_school_id: string;
  school_name: string;
  school_email: string;
  school_number: string;
  district: string;
  division: string;
  region: string;
  address: string;
  school_logo: string;
  deped_logo: string;
  other_logo: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SchoolSettingsFormValues = {
  deped_school_id: string;
  school_name: string;
  school_email: string;
  school_number: string;
  district: string;
  division: string;
  region: string;
  province: string;
  municipality_city: string;
  barangay: string;
  sitio_purok: string;
  address: string;
  school_logo: string;
  deped_logo: string;
  other_logo: string;
};

export type EmailSmtpSettings = {
  id: number | null;
  provider: "gmail";
  gmail_email: string;
  gmail_app_password: string;
  has_gmail_app_password: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  is_enabled: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type EmailSmtpSettingsFormValues = {
  gmail_email: string;
  gmail_app_password: string;
  smtp_secure: boolean;
  is_enabled: boolean;
};

export type EmailTemplateKey = "password_recovery" | "official_notices" | "otp";
export type ForgotPasswordMethod = "temporary_password" | "otp_email";

export type EmailTemplate = {
  id: number;
  template_key: EmailTemplateKey;
  template_name: string;
  subject: string;
  html_content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type EmailTemplateFormValues = {
  id: number | null;
  template_key: EmailTemplateKey;
  template_name: string;
  subject: string;
  html_content: string;
  is_active: boolean;
};

export type PasswordRecoverySettings = {
  forgot_password_method: ForgotPasswordMethod;
};
