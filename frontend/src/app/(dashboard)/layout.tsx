"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const tokens = useAuthStore((state) => state.tokens);
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    if (!tokens?.access) {
      router.push("/login");
    } else {
      initialize();
    }
  }, [tokens, router, initialize]);

  if (!tokens?.access) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-secondary/30 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
