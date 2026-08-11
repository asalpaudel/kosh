import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import BsDatePicker from "../../component/BsDatePicker";
import { API_BASE, apiFetch } from "../../lib/apiClient";
import { formatDualDate, todayInNepal } from "../../lib/nepaliDate";
import {
  parseShareCertificates, parseShareSettings, parseShareTransactions,
  type ShareCertificate, type ShareSettings, type ShareTransaction,
} from "../../lib/shares";
import { parseManagedUsers, type ManagedUser } from "../../lib/users";
import { isRecord } from "../../lib/validation";

type Operation = "purchase" | "transfer" | "refund";

const money = (value: number) => `Rs. ${value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
const requestRef = () => crypto.randomUUID();

export default function AdminShares() {
  const [networkId, setNetworkId] = useState<number | null>(null);
  const [settings, setSettings] = useState<ShareSettings | null>(null);
  const [register, setRegister] = useState<ShareCertificate[]>([]);
  const [transactions, setTransactions] = useState<ShareTransaction[]>([]);
  const [members, setMembers] = useState<ManagedUser[]>([]);
  const [operation, setOperation] = useState<Operation>("purchase");
  const [memberId, setMemberId] = useState("");
  const [toMemberId, setToMemberId] = useState("");
  const [shareCount, setShareCount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [date, setDate] = useState(todayInNepal());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async (id: number) => {
    const encoded = encodeURIComponent(String(id));
    const [settingsResponse, registerResponse, transactionResponse, usersResponse] = await Promise.all([
      apiFetch(`${API_BASE}/shares/network/${encoded}/settings`),
      apiFetch(`${API_BASE}/shares/network/${encoded}/register`),
      apiFetch(`${API_BASE}/shares/network/${encoded}/transactions`),
      apiFetch(`${API_BASE}/users`),
    ]);
    setSettings(parseShareSettings(await settingsResponse.json()));
    setRegister(parseShareCertificates(await registerResponse.json()));
    setTransactions(parseShareTransactions(await transactionResponse.json()));
    setMembers(parseManagedUsers(await usersResponse.json()).filter((user) => user.role === "member"));
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const response = await apiFetch(`${API_BASE}/session`);
        const session: unknown = await response.json();
        if (!isRecord(session)) throw new Error("Invalid session");
        const id = Number(session.sahakariId);
        if (!Number.isFinite(id)) throw new Error("Missing cooperative context");
        setNetworkId(id);
        await load(id);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Share register failed to load");
      }
    };
    void init();
  }, [load]);

  const activeMembers = useMemo(() => members.filter((member) => member.status === "Active"), [members]);
  const pendingMembers = useMemo(() => members.filter((member) => member.status === "Pending"), [members]);
  const activeCapital = register.reduce((sum, certificate) => sum + certificate.sharesHeld * (settings?.unitPrice ?? 0), 0);

  const refresh = async () => {
    if (networkId != null) await load(networkId);
  };

  const submitOperation = async (event: FormEvent) => {
    event.preventDefault();
    if (networkId == null) return;
    setBusy(true); setError(""); setMessage("");
    const body = operation === "transfer"
      ? { fromMemberId: Number(memberId), toMemberId: Number(toMemberId), shareCount: Number(shareCount), date, requestRef: requestRef() }
      : operation === "refund"
        ? { memberId: Number(memberId), paymentMethod, date, requestRef: requestRef() }
        : { memberId: Number(memberId), shareCount: Number(shareCount), paymentMethod, date, requestRef: requestRef() };
    try {
      await apiFetch(`${API_BASE}/shares/network/${encodeURIComponent(String(networkId))}/${operation}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      setMessage(operation === "refund" ? "Exit refund posted and membership suspended." : "Share movement posted to the ledger.");
      setShareCount(""); setToMemberId("");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Share operation failed");
    } finally { setBusy(false); }
  };

  const approveMember = async (member: ManagedUser) => {
    if (!settings) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await apiFetch(`${API_BASE}/users/${encodeURIComponent(String(member.id))}/approve`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initialShares: settings.minimumShares, paymentMethod: "Cash", date, requestRef: requestRef() }),
      });
      setMessage(`${member.name} approved with ${String(settings.minimumShares)} initial shares.`);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Member approval failed");
    } finally { setBusy(false); }
  };

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (networkId == null || !settings) return;
    setBusy(true); setError("");
    try {
      const response = await apiFetch(`${API_BASE}/shares/network/${encodeURIComponent(String(networkId))}/settings`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings),
      });
      setSettings(parseShareSettings(await response.json()));
      setMessage("Share rules saved.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not save share rules"); }
    finally { setBusy(false); }
  };

  const exportRegister = () => {
    const rows = [
      ["Certificate", "Member", "Shares", "Face value", "Issued (BS / AD)", "Status"],
      ...register.map((item) => [item.certificateNumber, item.memberName, String(item.sharesHeld),
        String(item.sharesHeld * (settings?.unitPrice ?? 0)), formatDualDate(item.issuedDate), item.status]),
    ];
    const csv = rows.map((row) => row.map((field) => `"${field.replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `share-register-${todayInNepal()}.csv`; link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-[calc(100vh-8.5rem)] bg-[#f7faf8] p-4 md:p-8">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-700">Equity subledger</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Share capital register</h1><p className="mt-2 text-sm text-slate-500">Certificates, statutory holding controls, and journal-backed movements.</p></div>
        <button type="button" onClick={exportRegister} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-teal-800">Export register</button>
      </header>
      {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p className="mb-5 rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">{message}</p>}

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        {[{ label: "Paid-up capital", value: money(activeCapital) }, { label: "Active certificates", value: String(register.filter((item) => item.status === "ACTIVE").length) }, { label: "Shares issued", value: register.reduce((sum, item) => sum + item.sharesHeld, 0).toLocaleString("en-IN") }].map((stat) => <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{stat.label}</p><p className="mt-2 text-2xl font-black text-slate-900">{stat.value}</p></div>)}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.35fr]">
        <div className="space-y-6">
          {settings && <form onSubmit={(event) => { void saveSettings(event); }} className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-black text-slate-900">Share rules</h2><div className="mt-4 grid grid-cols-3 gap-3">{([['unitPrice','Unit price'],['minimumShares','Minimum'],['statutoryMaxShares','Maximum']] as const).map(([key,label]) => <label key={key} className="text-xs font-bold text-slate-500">{label}<input type="number" min="1" step={key === 'unitPrice' ? '0.01' : '1'} value={settings[key]} onChange={(event) => { setSettings({ ...settings, [key]: Number(event.target.value) }); }} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900" /></label>)}</div><button disabled={busy} className="mt-4 w-full rounded-xl bg-teal-700 py-2.5 text-sm font-bold text-white disabled:opacity-50">Save rules</button></form>}

          <form onSubmit={(event) => { void submitOperation(event); }} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex gap-2">{(["purchase","transfer","refund"] as const).map((item) => <button key={item} type="button" onClick={() => { setOperation(item); }} className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${operation === item ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'}`}>{item}</button>)}</div><div className="mt-5 space-y-4"><label className="block text-xs font-bold text-slate-500">{operation === 'transfer' ? 'From member' : 'Member'}<select required value={memberId} onChange={(event) => { setMemberId(event.target.value); }} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Select member</option>{activeMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>{operation === 'transfer' && <label className="block text-xs font-bold text-slate-500">To member<select required value={toMemberId} onChange={(event) => { setToMemberId(event.target.value); }} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Select recipient</option>{activeMembers.filter((item) => String(item.id) !== memberId).map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>}{operation !== 'refund' && <label className="block text-xs font-bold text-slate-500">Number of shares<input required type="number" min="1" value={shareCount} onChange={(event) => { setShareCount(event.target.value); }} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>}{operation !== 'transfer' && <label className="block text-xs font-bold text-slate-500">Settlement<select value={paymentMethod} onChange={(event) => { setPaymentMethod(event.target.value); }} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option>Cash</option><option>Bank</option><option>Cheque</option></select></label>}<label className="block text-xs font-bold text-slate-500">Effective date (BS)<BsDatePicker value={date} onChange={setDate} className="mt-1" /></label></div><button disabled={busy} className="mt-5 w-full rounded-xl bg-slate-950 py-3 text-sm font-bold text-white disabled:opacity-50">{operation === 'refund' ? 'Post full exit refund' : 'Post share movement'}</button></form>
        </div>

        <div className="space-y-6">
          {pendingMembers.length > 0 && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-black text-amber-950">Membership awaiting share issue</h2><div className="mt-3 space-y-2">{pendingMembers.map((member) => <div key={member.id} className="flex items-center justify-between rounded-xl bg-white p-3"><div><p className="text-sm font-bold text-slate-900">{member.name}</p><p className="text-xs text-slate-500">Issue {settings?.minimumShares ?? 0} minimum shares</p></div><button disabled={busy || !settings} onClick={() => { void approveMember(member); }} className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-black text-amber-950 disabled:opacity-50">Approve + issue</button></div>)}</div></section>}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 p-5"><h2 className="text-lg font-black text-slate-900">Certificate register</h2></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Certificate</th><th className="px-5 py-3">Member</th><th className="px-5 py-3 text-right">Shares</th><th className="px-5 py-3 text-right">Value</th></tr></thead><tbody className="divide-y divide-slate-100">{register.map((item) => <tr key={item.id}><td className="px-5 py-4 font-mono text-xs text-teal-700">{item.certificateNumber}</td><td className="px-5 py-4"><p className="font-bold text-slate-900">{item.memberName}</p><p className="text-xs text-slate-400">{formatDualDate(item.issuedDate)}</p></td><td className="px-5 py-4 text-right font-bold">{item.sharesHeld}</td><td className="px-5 py-4 text-right">{money(item.sharesHeld * (settings?.unitPrice ?? 0))}</td></tr>)}</tbody></table>{register.length === 0 && <p className="p-8 text-center text-sm text-slate-400">No certificates issued yet.</p>}</div></section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 p-5"><h2 className="text-lg font-black text-slate-900">Recent register movements</h2></div><div className="divide-y divide-slate-100">{transactions.slice(0, 8).map((item) => <div key={item.id} className="flex items-center justify-between gap-4 p-4"><div><p className="text-sm font-bold text-slate-900">{item.transactionType.replace(/_/g, " ")}</p><p className="text-xs text-slate-400">#{item.journalSequence} · {item.transactionNumber} · {formatDualDate(item.transactionDate)}</p></div><div className="text-right"><p className="font-black text-slate-900">{item.shareCount} shares</p><p className="text-xs text-slate-500">{money(item.totalAmount)}</p></div></div>)}</div></section>
        </div>
      </div>
    </div>
  );
}
