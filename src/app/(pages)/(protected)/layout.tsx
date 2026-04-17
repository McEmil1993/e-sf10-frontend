import Main from "@/app/(pages)/main";
import { requireAuth } from "@/app/utils/auth";
import { getThemeSettings } from "@/app/utils/theme";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireAuth();
  const themeSettings = await getThemeSettings();

  return (
    <Main defaultSidebarCollapsed={themeSettings.defaultSidebarCollapsed} user={user}>
      {children}
    </Main>
  );
}
