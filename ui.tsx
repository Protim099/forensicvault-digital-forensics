"use client";
import { createContext, useCallback, useContext, useState } from "react";

const colors: Record<string, string> = { VERIFIED: "bg-emerald-600", verified: "bg-emerald-600", INTEGRITY_MISMATCH: "bg-red-600", flagged: "bg-red-600",
  FILE_MISSING: "bg-amber-600", unverified: "bg-slate-600", approved: "bg-emerald-600", rejected: "bg-red-600", pending: "bg-amber-600",
  critical: "bg-red-600", high: "bg-orange-600", medium: "bg-blue-600", low: "bg-slate-600" };
export const Badge = ({ v }: { v?: string | null }) => <span className={`rounded px-2 py-0.5 text-xs text-white ${colors[v || ""] || "bg-blue-700"}`}>{(v || "-").replace(/_/g, " ")}</span>;
export const Empty = ({ text }: { text: string }) => <div className="py-8 text-center text-sm text-slate-500">{text}</div>;
export const Loading = () => <div className="py-8 text-center text-sm text-slate-500 animate-pulse">Loading…</div>;

const ToastCtx = createContext<(m: string, err?: boolean) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<{ id: number; m: string; err?: boolean }[]>([]);
  const push = useCallback((m: string, err?: boolean) => {
    const id = Date.now() + Math.random(); setItems((i) => [...i, { id, m, err }]);
    setTimeout(() => setItems((i) => i.filter((x) => x.id !== id)), 4000);
  }, []);
  return <ToastCtx.Provider value={push}>{children}
    <div className="fixed bottom-4 right-4 space-y-2 z-50">{items.map((t) => <div key={t.id} className={`rounded px-3 py-2 text-sm text-white shadow ${t.err ? "bg-red-700" : "bg-emerald-700"}`}>{t.m}</div>)}</div>
  </ToastCtx.Provider>;
}
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
    <div className="card w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
      <div className="mb-3 flex justify-between"><h3 className="font-semibold">{title}</h3><button onClick={onClose}>✕</button></div>{children}</div></div>;
}
