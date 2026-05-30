import { redirect } from "next/navigation";
import SetNewPasswordForm from "@/app/components/Login/SetNewPasswordForm";
import { clearSession, getSessionData } from "@/app/utils/auth";
import { getTemporaryPasswordSession } from "@/app/utils/api";

export default async function SetNewPasswordPage() {
  const session = await getSessionData();

  if (!session) {
    redirect("/login");
  }

  const temporaryPasswordLogin = session.temporaryPasswordLogin;

  if (!temporaryPasswordLogin?.required) {
    redirect("/dashboard");
  }

  const result = await getTemporaryPasswordSession(
    temporaryPasswordLogin.recoveryRequestId,
    session.token,
  ).catch(() => null);

  if (!result?.temporaryPasswordLogin?.required) {
    await clearSession();
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <SetNewPasswordForm
        recoveryRequestId={result.temporaryPasswordLogin.recoveryRequestId}
        user={result.user}
      />
    </main>
  );
}
