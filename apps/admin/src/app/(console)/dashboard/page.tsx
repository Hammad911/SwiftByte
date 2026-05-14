"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

type Stats = {
  users: number;
  restaurants: number;
  orders: number;
  pendingRestaurantApplications: number;
  pendingRiderApprovals: number;
  gmvApprox: number;
};

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let on = true;
    apiFetch<Stats>("/api/admin/stats", { token })
      .then((d) => {
        if (on) setStats(d);
      })
      .catch((e) => on && setErr((e as Error).message));
    return () => {
      on = false;
    };
  }, [token]);

  if (err) return <p className="text-red-400">{err}</p>;
  if (!stats) return <p className="text-zinc-500">Loading metrics…</p>;

  const cards = [
    { label: "Registered users", value: stats.users },
    { label: "Approved restaurants", value: stats.restaurants },
    { label: "Orders (all time)", value: stats.orders },
    { label: "Restaurant applications (pending)", value: stats.pendingRestaurantApplications },
    { label: "Riders awaiting approval", value: stats.pendingRiderApprovals },
    {
      label: "Approx. GMV (order totals)",
      value: `Rs. ${stats.gmvApprox.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    }
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        High-level counts and platform throughput. Use the sidebar for approvals and monitoring.
      </p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <li
            key={c.label}
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4"
          >
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">{c.label}</div>
            <div className="mt-2 text-2xl font-semibold text-white">{c.value}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
