"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export default function Home() {
  const { ready, token, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (token && user?.role === "ADMIN") router.replace("/dashboard");
    else router.replace("/login");
  }, [ready, token, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
      Loading…
    </div>
  );
}
