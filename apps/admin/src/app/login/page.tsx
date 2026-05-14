"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export default function AdminLoginPage() {
  const { ready, token, user, login, logout } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (token && user?.role === "ADMIN") router.replace("/dashboard");
  }, [ready, token, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const u = await login(email, password);
      if (u.role !== "ADMIN") {
        logout();
        setErr("This account is not an administrator.");
        return;
      }
      router.replace("/dashboard");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-rose-400">
            SwiftBite
          </div>
          <h1 className="mt-2 text-xl font-semibold text-white">Admin sign in</h1>
          <p className="mt-1 text-sm text-zinc-500">Use your platform admin credentials.</p>
        </div>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400">Email</label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-rose-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-rose-500"
            />
          </div>
          {err ? <p className="text-sm text-red-400">{err}</p> : null}
          <button
            type="submit"
            disabled={busy || !ready}
            className="w-full rounded-lg bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-zinc-600">
          Demo seed:{" "}
          <code className="text-zinc-400">admin@swiftbite.demo</code> /{" "}
          <code className="text-zinc-400">demo1234</code>
        </p>
      </div>
      <Link href="/" className="mt-6 text-sm text-zinc-500 hover:text-zinc-300">
        ← Back
      </Link>
    </div>
  );
}
