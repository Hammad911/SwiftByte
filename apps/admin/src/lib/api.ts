import { DEFAULT_API_URL } from "@swiftbite/shared";

export function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_URL;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { token?: string | null }
): Promise<T> {
  const { token, ...rest } = init || {};
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...((rest.headers as Record<string, string>) || {})
  };
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${getApiBase()}${path}`, { ...rest, headers });
  const text = await res.text();
  if (!res.ok) {
    try {
      const j = JSON.parse(text) as { error?: string };
      throw new Error(j.error || text || res.statusText);
    } catch {
      throw new Error(text || res.statusText);
    }
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}
