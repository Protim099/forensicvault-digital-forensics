const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
// NOTE: tokens live in localStorage for simplicity; consider httpOnly cookies via a BFF for stricter XSS protection.
export const tokens = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem("fv_access")),
  set: (a: string, r: string) => { localStorage.setItem("fv_access", a); localStorage.setItem("fv_refresh", r); },
  clear: () => { localStorage.removeItem("fv_access"); localStorage.removeItem("fv_refresh"); localStorage.removeItem("fv_user"); },
};
export class ApiError extends Error { constructor(public status: number, public data: any) { super(typeof data?.detail === "string" ? data.detail : JSON.stringify(data)); } }

async function refresh(): Promise<boolean> {
  const r = localStorage.getItem("fv_refresh"); if (!r) return false;
  const res = await fetch(`${API}/auth/refresh/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh: r }) });
  if (!res.ok) return false;
  const d = await res.json(); tokens.set(d.access, d.refresh || r); return true;
}
export async function raw(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const headers: Record<string, string> = { ...(init.headers as any) };
  if (!(init.body instanceof FormData) && init.body) headers["Content-Type"] = "application/json";
  const t = tokens.get(); if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`${API}${path}`, { ...init, headers });
  if (res.status === 401 && retry && (await refresh())) return raw(path, init, false);
  if (res.status === 401 && path !== "/auth/login/") { tokens.clear(); window.location.href = "/login"; }
  return res;
}
export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await raw(path, init);
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}
export const post = (p: string, body?: any) => api(p, { method: "POST", body: body instanceof FormData ? body : JSON.stringify(body ?? {}) });
export async function download(path: string, filename: string) {
  const res = await raw(path); if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null));
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}
