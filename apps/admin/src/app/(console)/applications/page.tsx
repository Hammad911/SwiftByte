"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

type Applicant = { id: string; email: string; name: string; role: string };
type Application = {
  id: string;
  name: string;
  proposedSlug: string;
  description: string | null;
  cuisineTypes: string[];
  status: string;
  createdAt: string;
  applicant: Applicant;
};

export default function ApplicationsPage() {
  const { token } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    apiFetch<{ applications: Application[] }>("/api/admin/restaurant-applications", { token })
      .then((d) => setApplications(d.applications))
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
      await apiFetch(`/api/admin/restaurant-applications/${id}/approve`, {
        method: "POST",
        token
      });
      load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    if (!token) return;
    const note = window.prompt("Rejection note (optional):") ?? "";
    setBusyId(id);
    setErr(null);
    try {
      await apiFetch(`/api/admin/restaurant-applications/${id}/reject`, {
        method: "POST",
        token,
        body: JSON.stringify({ adminNote: note })
      });
      load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const pending = applications.filter((a) => a.status === "PENDING");

  return (
    <div className="space-y-4">
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      <p className="text-sm text-zinc-400">
        {pending.length} pending. Approving creates the restaurant and promotes the applicant to
        restaurant owner.
      </p>
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Restaurant</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {applications.map((a) => (
              <tr key={a.id} className="bg-zinc-950/40">
                <td className="px-4 py-3 font-medium text-white">{a.name}</td>
                <td className="px-4 py-3 text-zinc-400">{a.proposedSlug}</td>
                <td className="px-4 py-3 text-zinc-400">
                  {a.applicant.name}
                  <div className="text-xs text-zinc-600">{a.applicant.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      a.status === "PENDING"
                        ? "text-amber-400"
                        : a.status === "APPROVED"
                          ? "text-emerald-400"
                          : "text-zinc-500"
                    }
                  >
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {a.status === "PENDING" ? (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={busyId === a.id}
                        onClick={() => approve(a.id)}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyId === a.id}
                        onClick={() => reject(a.id)}
                        className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-zinc-600">—</span>
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
