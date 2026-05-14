"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";

const STATUSES = [
  "",
  "PENDING",
  "AWAITING_RESTAURANT",
  "ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED"
];

type OrderRow = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  restaurant: { slug: string; name: string };
  customer: { email: string; name: string };
  rider: { email: string; name: string } | null;
};

export default function OrdersAdminPage() {
  const { token } = useAuth();
  const [status, setStatus] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    apiFetch<{ orders: OrderRow[] }>(`/api/admin/orders${q}`, { token })
      .then((d) => setOrders(d.orders))
      .catch((e) => setErr((e as Error).message));
  }, [token, status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-zinc-400">
          Filter by status:{" "}
          <select
            className="ml-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-white"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s || "all"} value={s}>
                {s || "All"}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Restaurant</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Rider</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {orders.map((o) => (
              <tr key={o.id} className="bg-zinc-950/40">
                <td className="px-4 py-3 font-mono text-xs text-zinc-300">
                  <div>{o.id.slice(0, 8)}…</div>
                  <div className="text-zinc-600">{new Date(o.createdAt).toLocaleString()}</div>
                </td>
                <td className="px-4 py-3 text-zinc-300">{o.restaurant.name}</td>
                <td className="px-4 py-3 text-zinc-400">
                  {o.customer.name}
                  <div className="text-xs text-zinc-600">{o.customer.email}</div>
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {o.rider ? (
                    <>
                      {o.rider.name}
                      <div className="text-xs text-zinc-600">{o.rider.email}</div>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-amber-200/90">{o.status}</td>
                <td className="px-4 py-3 text-right text-white">
                  Rs. {o.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {orders.length === 0 ? <p className="text-sm text-zinc-500">No orders match.</p> : null}
    </div>
  );
}
