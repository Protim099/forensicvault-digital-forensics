"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FileText, FolderOpen, HardDrive, LayoutDashboard, LogOut, ScrollText, ShieldCheck } from "lucide-react";
import { post, tokens } from "@/lib/api";

const nav = [["/dashboard", "Dashboard", LayoutDashboard], ["/cases", "Cases", FolderOpen], ["/evidence", "Evidence", HardDrive],
  ["/reports", "Reports", FileText], ["/audit", "Audit Logs", ScrollText]] as const;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname(); const [user, setUser] = useState<any>(null);
  useEffect(() => { const u = localStorage.getItem("fv_user"); if (!tokens.get() || !u) window.location.href = "/login"; else setUser(JSON.parse(u)); }, []);
  async function logout() { try { await post("/auth/logout/", { refresh: localStorage.getItem("fv_refresh") }); } catch {} tokens.clear(); window.location.href = "/login"; }
  if (!user) return null;
  return <div className="flex min-h-screen">
    <aside className="w-56 shrink-0 border-r border-slate-800 bg-[#0e1626] p-3">
      <div className="mb-6 flex items-center gap-2 font-semibold"><ShieldCheck className="text-blue-500" /> ForensicVault</div>
      {nav.filter(([h]) => h !== "/audit" || user.role === "admin").map(([h, l, I]) =>
        <Link key={h} href={h} className={`mb-1 flex items-center gap-2 rounded px-2 py-2 text-sm ${path.startsWith(h) ? "bg-blue-600/30 text-white" : "text-slate-400 hover:bg-slate-800"}`}><I size={16} />{l}</Link>)}
    </aside>
    <div className="flex-1">
      <header className="flex items-center justify-end gap-3 border-b border-slate-800 px-4 py-2 text-sm">
        <span>{user.username} · <span className="text-blue-400">{user.role}</span></span>
        <button onClick={logout} className="btn-ghost flex items-center gap-1"><LogOut size={12} />Logout</button>
      </header>
      <main className="p-6">{children}</main>
    </div></div>;
}
