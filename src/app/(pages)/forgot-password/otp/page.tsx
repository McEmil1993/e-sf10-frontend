import { redirect } from "next/navigation";
import ForgotPasswordOtpForm from "@/app/components/Login/ForgotPasswordOtpForm";
import { requireGuest } from "@/app/utils/auth";

type OtpPageSearchParams = {
  email?: string | string[];
  expiresAt?: string | string[];
  recoveryRequestId?: string | string[];
};

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ForgotPasswordOtpPage({
  searchParams,
}: {
  searchParams: Promise<OtpPageSearchParams>;
}) {
  await requireGuest();

  const params = await searchParams;
  const email = getSearchParamValue(params.email)?.trim().toLowerCase() ?? "";
  const expiresAt = getSearchParamValue(params.expiresAt)?.trim() ?? "";
  const recoveryRequestId = Number(getSearchParamValue(params.recoveryRequestId));

  if (!email || !email.includes("@") || !expiresAt || !Number.isInteger(recoveryRequestId) || recoveryRequestId <= 0) {
    redirect("/forgot-password");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <ForgotPasswordOtpForm
        email={email}
        expiresAt={expiresAt}
        recoveryRequestId={recoveryRequestId}
      />
    </main>
  );
}
