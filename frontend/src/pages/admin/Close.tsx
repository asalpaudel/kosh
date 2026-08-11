import { useCallback, useEffect, useState } from "react";
import BsDatePicker from "../../component/BsDatePicker";
import { API_BASE, apiFetch } from "../../lib/apiClient";
import { formatDualDate, todayInNepal } from "../../lib/nepaliDate";
import { isRecord } from "../../lib/validation";

interface Period {
  id: number; periodType: "DAY_END" | "MONTH_END"; periodStart: string; periodEnd: string;
  closedAt: string; closedBy: string; reopenedAt: string | null; reopenedBy: string | null;
  reopenReason: string | null; status: "CLOSED" | "REOPENED";
}

interface InterestAccrual {
  id: number; accrualDate: string; productName: string; memberName: string;
  interestBasis: string; basisAmount: number; annualRate: number; accruedAmount: number;
}

interface RiskSettings {
  watchlistDays: number; substandardDays: number; doubtfulDays: number; lossDays: number;
  passRate: number; watchlistRate: number; substandardRate: number; doubtfulRate: number; lossRate: number;
}

interface RiskRow { loanId: number; memberName: string; productName: string; oldestOverdueDate: string | null; daysPastDue: number; classification: string; outstandingPrincipal: number; provisionRate: number; requiredProvision: number }
interface RiskReport { asOf: string; totalOutstanding: number; requiredProvision: number; npaRatio: number; par30: number; par60: number; par90: number; rows: RiskRow[] }

const DEFAULT_RISK_SETTINGS: RiskSettings = { watchlistDays: 1, substandardDays: 30, doubtfulDays: 90, lossDays: 180, passRate: 1, watchlistRate: 5, substandardRate: 25, doubtfulRate: 50, lossRate: 100 };

function parsePeriod(value: unknown): Period {
  if (!isRecord(value)) throw new Error("Invalid accounting period response");
  const numberValue = Number(value.id);
  if (!Number.isFinite(numberValue) || (value.periodType !== "DAY_END" && value.periodType !== "MONTH_END")
      || (value.status !== "CLOSED" && value.status !== "REOPENED")) throw new Error("Invalid accounting period response");
  const text = (key: string) => typeof value[key] === "string" ? value[key] : "";
  const nullable = (key: string) => value[key] == null ? null : text(key);
  return { id: numberValue, periodType: value.periodType, periodStart: text("periodStart"), periodEnd: text("periodEnd"),
    closedAt: text("closedAt"), closedBy: text("closedBy"), reopenedAt: nullable("reopenedAt"),
    reopenedBy: nullable("reopenedBy"), reopenReason: nullable("reopenReason"), status: value.status };
}

function parsePeriods(value: unknown): Period[] {
  if (!Array.isArray(value)) throw new Error("Invalid accounting period response");
  return value.map(parsePeriod);
}

function parseAccruals(value: unknown): InterestAccrual[] {
  if (!Array.isArray(value)) throw new Error("Invalid interest accrual response");
  return value.map((item) => {
    if (!isRecord(item)) throw new Error("Invalid interest accrual response");
    const id = Number(item.id); const basisAmount = Number(item.basisAmount);
    const annualRate = Number(item.annualRate); const accruedAmount = Number(item.accruedAmount);
    if (![id, basisAmount, annualRate, accruedAmount].every(Number.isFinite)) throw new Error("Invalid interest accrual response");
    const text = (key: string) => typeof item[key] === "string" ? item[key] : "";
    return { id, accrualDate: text("accrualDate"), productName: text("productName"),
      memberName: text("memberName"), interestBasis: text("interestBasis"),
      basisAmount, annualRate, accruedAmount };
  });
}

function parseRiskSettings(value: unknown): RiskSettings {
  if (!isRecord(value)) throw new Error("Invalid loan risk settings response");
  const result = { ...DEFAULT_RISK_SETTINGS };
  for (const key of Object.keys(result) as Array<keyof RiskSettings>) {
    const parsed = Number(value[key]); if (!Number.isFinite(parsed)) throw new Error("Invalid loan risk settings response"); result[key] = parsed;
  }
  return result;
}

function parseRiskReport(value: unknown): RiskReport {
  if (!isRecord(value) || !Array.isArray(value.rows)) throw new Error("Invalid loan risk report response");
  const metric = (key: string) => { const parsed = Number(value[key]); if (!Number.isFinite(parsed)) throw new Error("Invalid loan risk report response"); return parsed; };
  const rows = value.rows.map((item) => { if (!isRecord(item)) throw new Error("Invalid loan risk report response");
    const text = (key: string) => typeof item[key] === "string" ? item[key] : ""; const number = (key: string) => { const parsed = Number(item[key]); if (!Number.isFinite(parsed)) throw new Error("Invalid loan risk report response"); return parsed; };
    return { loanId: number("loanId"), memberName: text("memberName"), productName: text("productName"), oldestOverdueDate: item.oldestOverdueDate == null ? null : text("oldestOverdueDate"), daysPastDue: number("daysPastDue"), classification: text("classification"), outstandingPrincipal: number("outstandingPrincipal"), provisionRate: number("provisionRate"), requiredProvision: number("requiredProvision") }; });
  return { asOf: typeof value.asOf === "string" ? value.asOf : "", totalOutstanding: metric("totalOutstanding"), requiredProvision: metric("requiredProvision"), npaRatio: metric("npaRatio"), par30: metric("par30"), par60: metric("par60"), par90: metric("par90"), rows };
}

export default function AdminClose() {
  const [networkId, setNetworkId] = useState<number | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [accruals, setAccruals] = useState<InterestAccrual[]>([]);
  const [riskSettings, setRiskSettings] = useState<RiskSettings>(DEFAULT_RISK_SETTINGS);
  const [riskReport, setRiskReport] = useState<RiskReport | null>(null);
  const [date, setDate] = useState(todayInNepal());
  const [closeType, setCloseType] = useState<"DAY_END" | "MONTH_END">("DAY_END");
  const [reopenId, setReopenId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async (id: number, asOf = todayInNepal()) => {
    const encoded = encodeURIComponent(String(id));
    const [periodResponse, accrualResponse, settingsResponse, riskResponse] = await Promise.all([
      apiFetch(`${API_BASE}/close/network/${encoded}/periods`),
      apiFetch(`${API_BASE}/interest/network/${encoded}/accruals`),
      apiFetch(`${API_BASE}/loan-risk/network/${encoded}/settings`),
      apiFetch(`${API_BASE}/loan-risk/network/${encoded}/report?asOf=${encodeURIComponent(asOf)}`),
    ]);
    setPeriods(parsePeriods(await periodResponse.json()));
    setAccruals(parseAccruals(await accrualResponse.json()));
    setRiskSettings(parseRiskSettings(await settingsResponse.json()));
    setRiskReport(parseRiskReport(await riskResponse.json()));
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const response = await apiFetch(`${API_BASE}/session`);
        const session: unknown = await response.json();
        if (!isRecord(session)) throw new Error("Invalid session");
        const id = Number(session.sahakariId);
        if (!Number.isFinite(id)) throw new Error("Missing cooperative context");
        setNetworkId(id); await load(id, todayInNepal());
      } catch (caught) { setError(caught instanceof Error ? caught.message : "Close history failed to load"); }
    };
    void init();
  }, [load]);

  const runClose = async () => {
    if (networkId == null) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await apiFetch(`${API_BASE}/close/network/${encodeURIComponent(String(networkId))}/run`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processingDate: date, closeType }),
      });
      const body: unknown = await response.json();
      const alreadyProcessed = isRecord(body) && body.alreadyProcessed === true;
      setMessage(alreadyProcessed ? "This close was already processed; no entries were duplicated." : `${closeType.replace("_", "-")} completed and period locked.`);
      await load(networkId, date);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Close failed"); }
    finally { setBusy(false); }
  };

  const reopen = async () => {
    if (networkId == null || reopenId == null) return;
    setBusy(true); setError("");
    try {
      await apiFetch(`${API_BASE}/close/network/${encodeURIComponent(String(networkId))}/periods/${encodeURIComponent(String(reopenId))}/reopen`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }),
      });
      setMessage("Period reopened. The reason is preserved in the append-only activity trail.");
      setReopenId(null); setReason(""); await load(networkId, date);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Reopen failed"); }
    finally { setBusy(false); }
  };

  const saveRiskSettings = async () => {
    if (networkId == null) return;
    setBusy(true); setError("");
    try {
      await apiFetch(`${API_BASE}/loan-risk/network/${encodeURIComponent(String(networkId))}/settings`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(riskSettings),
      });
      setMessage("Loan aging thresholds and provision rates updated for future closes.");
      await load(networkId, date);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Risk settings failed to save"); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-[calc(100vh-8.5rem)] bg-[#f7faf8] p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7"><p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-700">Accounting operations</p><h1 className="mt-1 text-3xl font-black text-slate-950">Day-end & month-end close</h1><p className="mt-2 text-sm text-slate-500">One processing lock per date. Closed periods reject every back-dated journal posting.</p></header>
        {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {message && <p className="mb-5 rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">{message}</p>}
        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl"><p className="text-xs font-bold uppercase tracking-widest text-teal-300">Run close</p><div className="mt-5 flex gap-2">{(["DAY_END","MONTH_END"] as const).map((type) => <button key={type} type="button" onClick={() => { setCloseType(type); }} className={`rounded-full px-4 py-2 text-xs font-black ${closeType === type ? 'bg-teal-400 text-slate-950' : 'bg-white/10 text-slate-300'}`}>{type.replace("_", "-")}</button>)}</div><label className="mt-6 block text-xs font-bold text-slate-300">Processing date (BS)<BsDatePicker value={date} onChange={setDate} className="mt-2 text-slate-950" ariaLabel="Close processing date in Bikram Sambat" /></label><div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-5 text-slate-300">{closeType === 'DAY_END' ? 'Locks this exact business date after all registered close tasks complete.' : 'Requires the final day of the selected Bikram Sambat month and locks the full BS month.'}</div><button disabled={busy} onClick={() => { void runClose(); }} className="mt-6 w-full rounded-xl bg-teal-400 py-3 font-black text-slate-950 hover:bg-teal-300 disabled:opacity-50">Run {closeType.replace("_", "-").toLowerCase()}</button></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-black text-slate-900">Control guarantees</h2><div className="mt-5 space-y-4">{[{ n: '01', title: 'Exactly once', copy: 'A database uniqueness lock prevents a repeated close from reposting work.' }, { n: '02', title: 'Ledger-wide block', copy: 'The guard lives in LedgerService, covering transactions, shares, loans, and future accruals.' }, { n: '03', title: 'Authorised reopen', copy: 'Only the cooperative admin can reopen, with a mandatory reason logged to the audit trail.' }].map((item) => <div key={item.n} className="flex gap-4 border-b border-slate-100 pb-4 last:border-0"><span className="font-mono text-sm font-black text-teal-700">{item.n}</span><div><p className="font-black text-slate-900">{item.title}</p><p className="mt-1 text-sm text-slate-500">{item.copy}</p></div></div>)}</div></div>
        </section>
        <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 p-5"><h2 className="text-lg font-black text-slate-900">Period history</h2></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Type</th><th className="px-5 py-3">Period</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Operator</th><th className="px-5 py-3 text-right">Control</th></tr></thead><tbody className="divide-y divide-slate-100">{periods.map((period) => <tr key={period.id}><td className="px-5 py-4 font-bold text-slate-900">{period.periodType.replace("_", "-")}</td><td className="px-5 py-4"><p>{formatDualDate(period.periodStart)}</p>{period.periodStart !== period.periodEnd && <p className="text-xs text-slate-400">through {formatDualDate(period.periodEnd)}</p>}</td><td className="px-5 py-4"><span className={`rounded-full px-2 py-1 text-xs font-black ${period.status === 'CLOSED' ? 'bg-slate-900 text-white' : 'bg-amber-100 text-amber-800'}`}>{period.status}</span></td><td className="px-5 py-4 text-slate-500">{period.status === 'CLOSED' ? period.closedBy : period.reopenedBy}</td><td className="px-5 py-4 text-right">{period.status === 'CLOSED' && <button type="button" onClick={() => { setReopenId(period.id); }} className="text-xs font-black text-red-600 hover:text-red-800">Reopen</button>}</td></tr>)}</tbody></table>{periods.length === 0 && <p className="p-8 text-center text-sm text-slate-400">No periods have been closed.</p>}</div></section>
        <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 p-5"><p className="text-xs font-bold uppercase tracking-widest text-teal-700">Daily evidence</p><h2 className="mt-1 text-lg font-black text-slate-900">Savings interest accruals</h2></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Member</th><th className="px-5 py-3">Product / basis</th><th className="px-5 py-3 text-right">Eligible balance</th><th className="px-5 py-3 text-right">Rate</th><th className="px-5 py-3 text-right">Accrued</th></tr></thead><tbody className="divide-y divide-slate-100">{accruals.slice(0, 25).map((accrual) => <tr key={accrual.id}><td className="whitespace-nowrap px-5 py-4">{formatDualDate(accrual.accrualDate)}</td><td className="px-5 py-4 font-bold text-slate-900">{accrual.memberName}</td><td className="px-5 py-4"><p>{accrual.productName}</p><p className="text-xs text-slate-400">{accrual.interestBasis.replace(/_/g, " ")}</p></td><td className="px-5 py-4 text-right font-mono">Rs. {accrual.basisAmount.toLocaleString()}</td><td className="px-5 py-4 text-right font-mono">{accrual.annualRate}%</td><td className="px-5 py-4 text-right font-mono font-black text-teal-700">Rs. {accrual.accruedAmount.toLocaleString()}</td></tr>)}</tbody></table>{accruals.length === 0 && <p className="p-8 text-center text-sm text-slate-400">No savings interest has accrued yet.</p>}</div></section>
        <section className="mt-7 rounded-3xl bg-slate-950 p-6 text-white shadow-xl"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Portfolio health</p><h2 className="mt-1 text-2xl font-black">Loan aging & provisioning</h2><p className="mt-1 text-sm text-slate-400">As of {riskReport ? formatDualDate(riskReport.asOf) : "—"}</p></div><button type="button" disabled={busy} onClick={() => { void saveRiskSettings(); }} className="rounded-xl bg-teal-400 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-50">Save risk policy</button></div>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">{[{ label: "NPA", value: riskReport?.npaRatio ?? 0 }, { label: "PAR 30", value: riskReport?.par30 ?? 0 }, { label: "PAR 60", value: riskReport?.par60 ?? 0 }, { label: "PAR 90", value: riskReport?.par90 ?? 0 }, { label: "Provision", value: null }].map((metric) => <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{metric.label}</p><p className="mt-2 text-xl font-black">{metric.value == null ? `Rs. ${(riskReport?.requiredProvision ?? 0).toLocaleString()}` : `${String(metric.value)}%`}</p></div>)}</div>
          <div className="mt-6 grid gap-3 md:grid-cols-4">{(["watchlistDays","substandardDays","doubtfulDays","lossDays"] as const).map((key) => <label key={key} className="text-xs font-bold text-slate-300">{key.replace("Days", " days").replace(/^./, (value) => value.toUpperCase())}<input type="number" min="0" value={riskSettings[key]} onChange={(event) => { setRiskSettings((previous) => ({ ...previous, [key]: Number(event.target.value) })); }} className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white" /></label>)}</div>
          <div className="mt-3 grid gap-3 md:grid-cols-5">{(["passRate","watchlistRate","substandardRate","doubtfulRate","lossRate"] as const).map((key) => <label key={key} className="text-xs font-bold text-slate-300">{key.replace("Rate", " rate").replace(/^./, (value) => value.toUpperCase())} (%)<input type="number" min="0" max="100" step="0.01" value={riskSettings[key]} onChange={(event) => { setRiskSettings((previous) => ({ ...previous, [key]: Number(event.target.value) })); }} className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white" /></label>)}</div>
        </section>
        <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 p-5"><h2 className="text-lg font-black text-slate-900">Loan aging report</h2></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Loan / member</th><th className="px-5 py-3">Oldest overdue</th><th className="px-5 py-3">Class</th><th className="px-5 py-3 text-right">Outstanding</th><th className="px-5 py-3 text-right">Provision</th></tr></thead><tbody className="divide-y divide-slate-100">{riskReport?.rows.map((row) => <tr key={row.loanId}><td className="px-5 py-4"><p className="font-bold text-slate-900">#{row.loanId} · {row.memberName}</p><p className="text-xs text-slate-400">{row.productName}</p></td><td className="px-5 py-4">{row.oldestOverdueDate ? <><p>{formatDualDate(row.oldestOverdueDate)}</p><p className="text-xs text-slate-400">{row.daysPastDue} days past due</p></> : "Current"}</td><td className="px-5 py-4"><span className={`rounded-full px-2 py-1 text-xs font-black ${row.classification === "PASS" ? "bg-emerald-100 text-emerald-800" : row.classification === "WATCHLIST" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>{row.classification}</span></td><td className="px-5 py-4 text-right font-mono">Rs. {row.outstandingPrincipal.toLocaleString()}</td><td className="px-5 py-4 text-right"><p className="font-mono font-black">Rs. {row.requiredProvision.toLocaleString()}</p><p className="text-xs text-slate-400">{row.provisionRate}%</p></td></tr>)}</tbody></table>{(!riskReport || riskReport.rows.length === 0) && <p className="p-8 text-center text-sm text-slate-400">No approved loan exposure.</p>}</div></section>
      </div>
      {reopenId != null && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-black text-slate-950">Authorised period reopen</h2><p className="mt-2 text-sm text-slate-500">This action is logged. Explain the correction that requires back-dated posting.</p><textarea value={reason} onChange={(event) => { setReason(event.target.value); }} rows={4} className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder="Reason (minimum 8 characters)" /><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => { setReopenId(null); setReason(""); }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">Cancel</button><button type="button" disabled={busy || reason.trim().length < 8} onClick={() => { void reopen(); }} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Reopen period</button></div></div></div>}
    </div>
  );
}
