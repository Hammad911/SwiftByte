"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardList,
  Home,
  LogOut,
  Package,
  Store,
  UserCog,
  Users
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";

const nav = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/applications", label: "Restaurant applications", icon: ClipboardList },
  { href: "/restaurants", label: "Restaurants", icon: Store },
  { href: "/riders", label: "Riders", icon: UserCog },
  { href: "/users", label: "All users", icon: Users },
  { href: "/orders", label: "Orders", icon: Package }
];

const titles: Record<string, string> = {
  "/dashboard": "Platform overview",
  "/applications": "Restaurant applications",
  "/restaurants": "Restaurants",
  "/riders": "Rider approvals",
  "/users": "User directory",
  "/orders": "Order monitor"
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const pageTitle = titles[pathname] || "Admin";

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <aside className="flex w-60 flex-col border-r border-zinc-800 bg-zinc-900/80">
        <div className="border-b border-zinc-800 px-4 py-5">
          <div className="text-xs font-medium uppercase tracking-wider text-rose-400">
            SwiftBite
          </div>
          <div className="mt-1 text-lg font-semibold text-white">Admin console</div>
          {user && (
            <div className="mt-3 truncate text-xs text-zinc-500" title={user.email}>
              {user.email}
            </div>
          )}
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-rose-600/20 text-rose-100"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-zinc-800 p-2">
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="border-b border-zinc-800 bg-zinc-950/80 px-8 py-6 backdrop-blur">
          <h1 className="text-2xl font-semibold tracking-tight text-white">{pageTitle}</h1>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
