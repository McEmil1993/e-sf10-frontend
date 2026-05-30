import Main from "@/app/(pages)/main";
import { getSessionData, requireAuth } from "@/app/utils/auth";
import { getThemeSettings } from "@/app/utils/theme";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSessionData();

  if (session?.temporaryPasswordLogin?.required) {
    redirect("/set-new-password");
  }

  const user = await requireAuth();
  const themeSettings = await getThemeSettings();

  return (
    <Main defaultSidebarCollapsed={themeSettings.defaultSidebarCollapsed} user={user}>
      {children}
    </Main>
  );
}
