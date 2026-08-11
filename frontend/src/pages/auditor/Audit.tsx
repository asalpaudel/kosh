import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE, apiFetch } from "../../lib/apiClient";
import { isRecord } from "../../lib/validation";

interface Overview {
  networkId: number;
  networkName: string;
  generatedAt: string;
  transactionCount: number;
  pendingApprovals: number;
  journalEntryCount: number;
  latestSequence: number;
  latestEntryHash: string | null;
  activityCount: number;
  accountingPeriodCount: number;
}

function numberField(value: Record<string, unknown>, key: string): number {
  return typeof value[key] === "number" ? value[key] : 0;
}

function parseOverview(value: unknown): Overview {
  if (!isRecord(value) || typeof value.networkName !== "string") throw new Error("Invalid audit summary");
  return {
    networkId: numberField(value, "networkId"), networkName: value.networkName,
    generatedAt: typeof value.generatedAt === "string" ? value.generatedAt : "",
    transactionCount: numberField(value, "transactionCount"), pendingApprovals: numberField(value, "pendingApprovals"),
    journalEntryCount: numberField(value, "journalEntryCount"), latestSequence: numberField(value, "latestSequence"),
    latestEntryHash: typeof value.latestEntryHash === "string" ? value.latestEntryHash : null,
    activityCount: numberField(value, "activityCount"), accountingPeriodCount: numberField(value, "accountingPeriodCount"),
  };
}

export default function AuditorAudit() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    void (async () => {
      try {
        const sessionResponse = await apiFetch(`${API_BASE}/session`);
        const session: unknown = await sessionResponse.json();
        if (!isRecord(session) || session.role !== "auditor" || typeof session.sahakariId !== "number") throw new Error("Auditor access is required");
        const response = await apiFetch(`${API_BASE}/audit/network/${String(session.sahakariId)}/overview`);
        setOverview(parseOverview(await response.json()));
      } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load audit workspace"); }
    })();
  }, []);

  const exportPack = async () => {
    if (!overview) return;
    setExporting(true); setError("");
    try {
      const response = await apiFetch(`${API_BASE}/audit/network/${String(overview.networkId)}/pack`);
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = url; link.download = `kosh-audit-pack-${String(overview.networkId)}.zip`; link.click();
      URL.revokeObjectURL(url);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Export failed"); }
    finally { setExporting(false); }
  };

  const logout = async () => { try { await apiFetch(`${API_BASE}/auth/logout`, { method: "POST" }); } finally { void navigate("/login"); } };
  const cards = overview ? [
    ["Transactions", overview.transactionCount], ["Journal entries", overview.journalEntryCount],
    ["Pending approvals", overview.pendingApprovals], ["Activity events", overview.activityCount],
    ["Accounting periods", overview.accountingPeriodCount], ["Latest sequence", overview.latestSequence],
  ] : [];

  return <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100 md:px-10">
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-col gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[.25em] text-teal-400">Read-only audit workspace</p><h1 className="mt-3 text-3xl font-black md:text-5xl">{overview?.networkName ?? "Cooperative audit"}</h1><p className="mt-2 text-slate-400">Tenant-scoped records. No operational write access.</p></div>
        <div className="flex gap-3"><button onClick={() => { void exportPack(); }} disabled={!overview || exporting} className="rounded-full bg-teal-400 px-5 py-3 font-black text-slate-950 disabled:opacity-50">{exporting ? "Preparing…" : "Export audit pack"}</button><button onClick={() => { void logout(); }} className="rounded-full border border-white/20 px-5 py-3 font-bold">Log out</button></div>
      </header>
      {error && <p role="alert" className="mt-6 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">{error}</p>}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([label, value]) => <article key={label} className="rounded-2xl border border-white/10 bg-white/[.04] p-6"><p className="text-sm font-bold text-slate-400">{label}</p><p className="mt-3 text-4xl font-black text-white">{value}</p></article>)}</section>
      {overview && <section className="mt-8 rounded-2xl border border-white/10 bg-white/[.04] p-6"><p className="text-xs font-black uppercase tracking-widest text-slate-500">Latest tamper-evident journal hash</p><p className="mt-3 break-all font-mono text-sm text-teal-300">{overview.latestEntryHash ?? "No journal entries yet"}</p><p className="mt-5 text-xs text-slate-500">Snapshot generated {new Date(overview.generatedAt).toLocaleString()}</p></section>}
    </div>
  </main>;
}
