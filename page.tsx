"use client";
import { useCallback, useEffect, useState } from "react";
import { api, download, post } from "@/lib/api";
import { Badge, Empty, Loading, useToast } from "@/components/ui";

export default function Reports() {
  const toast = useToast(); const [rows, setRows] = useState<any[] | null>(null); const [cases, setCases] = useState<any[]>([]); const [me, setMe] = useState<any>({});
  const [f, setF] = useState({ case: "", findings: "", conclusion: "" });
  const load = useCallback(() => api("/reports/").then((d) => setRows(d.results)).catch((e) => toast(e.message, true)), []);
  useEffect(() => { setMe(JSON.parse(localStorage.getItem("fv_user") || "{}")); api("/cases/").then((d) => setCases(d.results)); load(); }, [load]);
  const act = async (fn: () => Promise<any>, ok: string) => { try { await fn(); toast(ok); load(); } catch (e: any) { toast(e.message, true); } };
  return <div className="space-y-3">
    {me.role === "investigator" && <form className="card grid gap-2 md:grid-cols-4" onSubmit={(e) => { e.preventDefault(); act(() => post("/reports/", f), "Report generated"); }}>
      <select className="input" required value={f.case} onChange={(e) => setF({ ...f, case: e.target.value })}><option value="">Case…</option>{cases.map((c) => <option key={c.id} value={c.id}>{c.case_number}</option>)}</select>
      <input className="input" placeholder="Findings" value={f.findings} onChange={(e) => setF({ ...f, findings: e.target.value })} />
      <input className="input" placeholder="Conclusion" value={f.conclusion} onChange={(e) => setF({ ...f, conclusion: e.target.value })} /><button className="btn">Generate PDF</button></form>}
    <div className="card">{!rows ? <Loading /> : !rows.length ? <Empty text="No reports yet" /> :
      <table className="w-full"><thead><tr><th>Case</th><th>Version</th><th>Status</th><th>By</th><th>Created</th><th /></tr></thead><tbody>
        {rows.map((r) => <tr key={r.id}><td>{r.case_number}</td><td>v{r.version}</td><td><Badge v={r.status} /></td><td>{r.generated_by_name}</td><td>{new Date(r.created_at).toLocaleString()}</td>
          <td className="space-x-1"><button className="btn-ghost" onClick={() => download(`/reports/${r.id}/download/`, `${r.case_number}-v${r.version}.pdf`).catch((e) => toast(e.message, true))}>Download</button>
            {me.role === "reviewer" && r.status === "pending" && <><button className="btn-ghost" onClick={() => act(() => post(`/reports/${r.id}/review/`, { decision: "approved" }), "Approved")}>Approve</button>
              <button className="btn-ghost" onClick={() => act(() => post(`/reports/${r.id}/review/`, { decision: "rejected" }), "Rejected")}>Reject</button></>}</td></tr>)}</tbody></table>}</div>
  </div>;
}
