import { useEffect, useState } from "react";
import { API_BASE, apiFetch } from "../../lib/apiClient";
import { formatDualDate } from "../../lib/nepaliDate";
import { parseShareCertificate, parseShareTransactions, type ShareCertificate, type ShareTransaction } from "../../lib/shares";

export default function UserShares() {
  const [certificate, setCertificate] = useState<ShareCertificate | null>(null);
  const [transactions, setTransactions] = useState<ShareTransaction[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [certificateResponse, transactionResponse] = await Promise.all([
          apiFetch(`${API_BASE}/shares/me/certificate`), apiFetch(`${API_BASE}/shares/me/transactions`),
        ]);
        setCertificate(parseShareCertificate(await certificateResponse.json()));
        setTransactions(parseShareTransactions(await transactionResponse.json()));
      } catch (caught) { setError(caught instanceof Error ? caught.message : "Share certificate failed to load"); }
    };
    void load();
  }, []);

  return (
    <div className="min-h-[calc(100vh-8.5rem)] bg-[#f7faf8] p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-7"><p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-700">Member equity</p><h1 className="mt-1 text-3xl font-black text-slate-950">My share certificate</h1></header>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
        {certificate && <section className="relative overflow-hidden rounded-3xl border border-teal-200 bg-[#fffdf4] p-7 shadow-[0_22px_70px_rgba(15,118,110,0.12)] md:p-10"><div className="absolute -right-12 -top-12 h-44 w-44 rounded-full border-[28px] border-teal-100/60" /><div className="relative"><div className="flex flex-wrap justify-between gap-4 border-b border-teal-200 pb-6"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-teal-700">Kosh cooperative share</p><h2 className="mt-2 text-2xl font-black text-slate-950">Certificate of membership equity</h2></div><p className="font-mono text-sm font-bold text-teal-800">{certificate.certificateNumber}</p></div><div className="mt-8 grid gap-7 sm:grid-cols-3"><div><p className="text-xs font-bold uppercase text-slate-400">Registered member</p><p className="mt-2 text-xl font-black text-slate-900">{certificate.memberName}</p></div><div><p className="text-xs font-bold uppercase text-slate-400">Shares held</p><p className="mt-2 text-3xl font-black text-teal-800">{certificate.sharesHeld.toLocaleString("en-IN")}</p></div><div><p className="text-xs font-bold uppercase text-slate-400">Issued</p><p className="mt-2 text-sm font-bold text-slate-800">{formatDualDate(certificate.issuedDate)}</p></div></div><p className="mt-8 text-xs leading-5 text-slate-500">This certificate reflects the current holding in the cooperative’s share register. Every purchase, transfer, and refund is tied to an append-only journal sequence.</p></div></section>}
        <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 p-5"><h2 className="text-lg font-black text-slate-900">Share history</h2></div><div className="divide-y divide-slate-100">{transactions.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="text-sm font-black text-slate-900">{item.transactionType.replace(/_/g, " ")}</p><p className="mt-1 text-xs text-slate-400">Journal #{item.journalSequence} · {formatDualDate(item.transactionDate)}</p></div><div className="text-right"><p className="font-black text-teal-800">{item.shareCount} shares</p><p className="text-xs text-slate-500">Rs. {item.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p></div></div>)}{transactions.length === 0 && <p className="p-8 text-center text-sm text-slate-400">No share movements yet.</p>}</div></section>
      </div>
    </div>
  );
}
