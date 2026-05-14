"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  riderApproved: boolean;
  suspended: boolean;
  createdAt: string;
};

export default function RidersAdminPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    apiFetch<{ users: UserRow[] }>("/api/admin/users?role=RIDER", { token })
      .then((d) => setUsers(d.users))
      .catch((e) => setErr((e as Error).message));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(id: string) {
    if (!token) return;
    setBusyId(id);
    setErr(null);
    try {
      await apiFetch(`/api/admin/riders/${id}/approve`, { method: "POST", token });
      load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const pending = users.filter((u) => !u.riderApproved);
  const active = users.filter((u) => u.riderApproved);

  return (
    <div className="space-y-8">
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      <section>
        <h2 className="text-lg font-semibold text-white">
          Pending approval ({pending.length})
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          New rider registrations must be cleared before they can go online.
        </p>
        <ul className="mt-4 divide-y divide-zinc-800 rounded-xl border border-zinc-800">
          {pending.length === 0 ? (
            <li className="px-4 py-6 text-sm text-zinc-500">No pending riders.</li>
          ) : (
            pending.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950/40 px-4 py-3"
              >
                <div>
                  <div className="font-medium text-white">{u.name}</div>
                  <div className="text-xs text-zinc-500">{u.email}</div>
                </div>
                <button
                  type="button"
                  disabled={busyId === u.id}
                  onClick={() => approve(u.id)}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  Approve rider
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Approved riders ({active.length})</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Suspended</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {active.map((u) => (
                <tr key={u.id} className="bg-zinc-950/40">
                  <td className="px-4 py-3 text-white">{u.name}</td>
                  <td className="px-4 py-3 text-zinc-400">{u.email}</td>
                  <td className="px-4 py-3">{u.suspended ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
