"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

type Row = {
  id: string;
  name: string;
  slug: string;
  verificationStatus: string;
  isOpen: boolean;
  owner: { id: string; email: string; name: string };
};

const STATUSES = ["PENDING_APPROVAL", "APPROVED", "SUSPENDED"] as const;

export default function RestaurantsAdminPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    apiFetch<{ restaurants: Row[] }>("/api/admin/restaurants", { token })
      .then((d) => setRows(d.restaurants))
      .catch((e) => setErr((e as Error).message));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function patchStatus(id: string, status: string) {
    if (!token) return;
    setBusyId(id);
    setErr(null);
    try {
      await apiFetch(`/api/admin/restaurants/${id}/verification`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status })
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
        Change verification status to temporarily hide a venue (suspend) or bring one online after
        review.
      </p>
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Open</th>
              <th className="px-4 py-3">Verification</th>
              <th className="px-4 py-3 text-right">Set status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {rows.map((r) => (
              <tr key={r.id} className="bg-zinc-950/40">
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{r.name}</div>
                  <div className="text-xs text-zinc-600">{r.slug}</div>
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {r.owner.name}
                  <div className="text-xs text-zinc-600">{r.owner.email}</div>
                </td>
                <td className="px-4 py-3">{r.isOpen ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-amber-200/90">{r.verificationStatus}</td>
                <td className="px-4 py-3 text-right">
                  <select
                    className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-white"
                    disabled={busyId === r.id}
                    value={r.verificationStatus}
                    onChange={(e) => patchStatus(r.id, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
