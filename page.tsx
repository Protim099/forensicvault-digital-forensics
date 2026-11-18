"use client";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { api, tokens } from "@/lib/api";

export default function Login() {
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const d = await api("/auth/login/", { method: "POST", body: JSON.stringify({ username: u, password: p }) });
      tokens.set(d.access, d.refresh); localStorage.setItem("fv_user", JSON.stringify(d.user)); window.location.href = "/dashboard";
    } catch { setErr("Invalid credentials or too many attempts."); } finally { setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center p-4">
    <form onSubmit={submit} className="card w-full max-w-sm space-y-3">
      <div className="flex items-center gap-2 text-xl font-semibold"><ShieldCheck className="text-blue-500" /> ForensicVault</div>
      <input className="input" placeholder="Username" value={u} onChange={(e) => setU(e.target.value)} required />
      <input className="input" type="password" placeholder="Password" value={p} onChange={(e) => setP(e.target.value)} required />
      {err && <p className="text-sm text-red-400">{err}</p>}
      <button className="btn w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form></main>;
}
