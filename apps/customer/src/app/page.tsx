"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { apiFetch } from "@/lib/api";

type RestaurantCard = {
  slug: string;
  name: string;
  description: string | null;
  cuisineTypes: string[];
  isOpen: boolean;
  minOrder: number;
  prepTime: number;
  rating: number;
  deliveryFee: number;
  deliveryTimeMins: number;
};

export default function HomePage() {
  const [qDraft, setQDraft] = useState("");
  const [q, setQ] = useState("");
  const [cuisine, setCuisine] = useState("");

  const query = useQuery({
    queryKey: ["restaurants", q, cuisine],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (cuisine) params.set("cuisine", cuisine);
      params.set("openOnly", "1");
      return apiFetch<{ restaurants: RestaurantCard[] }>(`/api/restaurants?${params.toString()}`);
    }
  });

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    (query.data?.restaurants || []).forEach((r) => r.cuisineTypes.forEach((t) => tags.add(t)));
    return Array.from(tags).slice(0, 12);
  }, [query.data?.restaurants]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="relative overflow-hidden rounded-2xl border border-emerald-900/40 bg-gradient-to-br from-emerald-950/80 via-zinc-950 to-zinc-950 px-6 py-12 sm:px-10">
        <div className="relative max-w-xl">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Hungry? Order from kitchens you love.
          </h1>
          <p className="mt-2 text-zinc-400">
            Search by restaurant or cuisine — delivery powered by the SwiftBite API.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={qDraft}
                onChange={(e) => setQDraft(e.target.value)}
                placeholder="Search restaurants / dishes"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 pl-10 pr-4 text-white outline-none ring-emerald-500/30 placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-2"
              />
            </div>
            <button
              type="button"
              onClick={() => setQ(qDraft.trim())}
              className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Search
            </button>
          </div>
        </div>
      </section>

      {allTags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCuisine("")}
            className={`rounded-full px-4 py-1.5 text-sm ${
              !cuisine ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            All
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setCuisine(t === cuisine ? "" : t)}
              className={`rounded-full px-4 py-1.5 text-sm ${
                cuisine === t ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Near you</h2>
        {query.isLoading ? (
          <p className="mt-4 text-zinc-500">Loading restaurants…</p>
        ) : query.isError ? (
          <p className="mt-4 text-red-400">
            {(query.error as Error).message} — start the API on <code>127.0.0.1:3333</code>
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(query.data?.restaurants || []).map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/r/${r.slug}`}
                  className="block h-full rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition hover:border-emerald-800/60 hover:bg-zinc-900"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-white">{r.name}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {(r.cuisineTypes || []).join(" · ") || "Mixed"}
                      </div>
                    </div>
                    <span className="text-amber-400">★ {r.rating.toFixed(1)}</span>
                  </div>
                  {r.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{r.description}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
                    <span>{r.deliveryTimeMins} min</span>
                    <span>Fee Rs.{r.deliveryFee}</span>
                    <span>Min Rs.{r.minOrder}</span>
                    {!r.isOpen ? (
                      <span className="text-red-400">Closed</span>
                    ) : (
                      <span className="text-emerald-400">Open</span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
