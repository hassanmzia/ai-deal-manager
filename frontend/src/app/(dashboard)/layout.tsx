"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ErrorBoundary } from "@/components/error-boundary";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const tokens = useAuthStore((state) => state.tokens);
  const initialize = useAuthStore((state) => state.initialize);
  // Track whether we've completed the client-side auth check.
  // This prevents rendering different trees on server vs client (hydration errors).
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // initialize() reads localStorage and fetches /auth/me/ — client-side only
    initialize().finally(() => setMounted(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mounted && !tokens?.access) {
      router.push("/login");
    }
  }, [mounted, tokens, router]);

  // Render nothing until the client-side auth check completes.
  // Both server and first client render return null → no mismatch.
  if (!mounted) {
    return null;
  }

  if (!tokens?.access) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-secondary/30 p-6">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
