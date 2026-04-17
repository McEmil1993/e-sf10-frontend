"use client";

import { useEffect, useState } from "react";
import { mainNavItems } from "@/app/config/navItems";
import Footer from "@/app/components/Footer/Footer";
import SideNav from "@/app/components/SideNav/SideNav";
import TopNav from "@/app/components/TopNav/TopNav";
import type { MainProps } from "@/app/types/mainTypes";

export default function Main({
  children,
  defaultSidebarCollapsed = false,
  user,
}: MainProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(defaultSidebarCollapsed);

  useEffect(() => {
    setIsSidebarCollapsed(defaultSidebarCollapsed);
  }, [defaultSidebarCollapsed]);

  function handleMenuToggle() {
    if (window.innerWidth >= 768) {
      setIsSidebarCollapsed((currentValue) => !currentValue);
      return;
    }

    setIsSidebarOpen((currentValue) => !currentValue);
  }

  return (
    <div className="admin-shell flex h-screen flex-col overflow-hidden bg-background">
      <TopNav
        isSidebarCollapsed={isSidebarCollapsed}
        onMenuToggle={handleMenuToggle}
        user={user}
      />
      <div className="flex min-h-0 flex-1">
        <SideNav
          isCollapsed={isSidebarCollapsed}
          isOpen={isSidebarOpen}
          items={mainNavItems}
          onClose={() => setIsSidebarOpen(false)}
          user={user}
        />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <main className="admin-content flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4">{children}</div>
          </main>
          <Footer caption="Admin dashboard template built with Next.js App Router, Tailwind CSS, cookies, and local mock data." />
        </div>
      </div>
    </div>
  );
}
