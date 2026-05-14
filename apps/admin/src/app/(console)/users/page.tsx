"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  suspended: boolean;
  riderApproved: boolean;
  createdAt: string;
};

export default function UsersAdminPage() {
  const { token, user: me } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    apiFetch<{ users: UserRow[] }>("/api/admin/users", { token })
      .then((d) => setUsers(d.users))
      .catch((e) => setErr((e as Error).message));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function setSuspended(id: string, suspended: boolean) {
    if (!token) return;
    if (id === me?.id) {
      setErr("You cannot change your own suspension state here.");
      return;
    }
    setBusyId(id);
    setErr(null);
    try {
      await apiFetch(`/api/admin/users/${id}/suspend`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ suspended })
      });
      load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      <p className="text-sm text-zinc-400">
        Suspending a user blocks login. Use restaurants / riders for domain-specific workflows.
      </p>
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Flags</th>
              <th className="px-4 py-3 text-right">Suspend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {users.map((u) => (
              <tr key={u.id} className="bg-zinc-950/40">
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{u.name}</div>
                  <div className="text-xs text-zinc-600">{u.email}</div>
                </td>
                <td className="px-4 py-3 text-zinc-400">{u.role}</td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {u.suspended ? "Suspended · " : ""}
                  {u.role === "RIDER" && !u.riderApproved ? "Rider pending · " : ""}
                </td>
                <td className="px-4 py-3 text-right">
                  {u.id === me?.id ? (
                    <span className="text-zinc-600">—</span>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === u.id}
                      onClick={() => setSuspended(u.id, !u.suspended)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        u.suspended
                          ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                          : "bg-rose-900/50 text-rose-200 hover:bg-rose-900/70"
                      } disabled:opacity-50`}
                    >
                      {u.suspended ? "Unsuspend" : "Suspend"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
