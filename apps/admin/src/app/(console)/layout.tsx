"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { useAuth } from "@/components/auth-provider";

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const { ready, token, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!token || user?.role !== "ADMIN") router.replace("/login");
  }, [ready, token, user, router]);

  if (!ready || !token || user?.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-500">
        Loading…
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
