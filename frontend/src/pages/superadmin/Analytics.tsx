import { useEffect, useState, type ReactNode } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AnalyticsChart from "../../component/superadmin/AnalyticsChart";
import { generateSummary, type MonthlyRevenue } from "../../component/superadmin/analyticsRevenue";
import { API_BASE, apiFetch } from "../../lib/apiClient";
import { isRecord } from "../../lib/validation";
import { formatDualDate, todayInNepal } from "../../lib/nepaliDate";

interface RevenueTotals {
  basic: number;
  premium: number;
  custom: number;
}

interface NetworkStats {
  networks: number;
  admins: number;
  members: number;
}

const EMPTY_TOTALS: RevenueTotals = { basic: 0, premium: 0, custom: 0 };
const EMPTY_STATS: NetworkStats = { networks: 0, admins: 0, members: 0 };

function finiteNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseTotals(value: unknown): RevenueTotals {
  if (!isRecord(value)) throw new Error("Invalid revenue totals response");
  return { basic: finiteNumber(value.basic), premium: finiteNumber(value.premium), custom: finiteNumber(value.custom) };
}

function parseMonthlyRevenue(value: unknown): MonthlyRevenue[] {
  if (!Array.isArray(value)) throw new Error("Invalid monthly revenue response");
  return value.map((item) => {
    if (!isRecord(item)) throw new Error("Monthly revenue contains an invalid row");
    return {
      month: typeof item.month === "string" ? item.month : typeof item.name === "string" ? item.name : "Unknown",
      basic: finiteNumber(item.basic), premium: finiteNumber(item.premium), custom: finiteNumber(item.custom),
    };
  });
}

function parseNetworkStats(value: unknown): NetworkStats {
  if (!isRecord(value)) throw new Error("Invalid network snapshot response");
  return {
    networks: finiteNumber(value.networks), admins: finiteNumber(value.admins),
    members: finiteNumber(value.members),
  };
}

const Kicker = ({ children }: { children: ReactNode }) => <p className="text-[11px] uppercase tracking-widest text-gray-400">{children}</p>;
const SectionTitle = ({ children }: { children: ReactNode }) => <h2 className="text-lg font-medium text-gray-900">{children}</h2>;
const Divider = () => <div className="border-t border-gray-200 my-10" />;

const Stat = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="space-y-1">
    <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
    <p className="text-xl font-semibold text-gray-900">{value}</p>
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
  </div>
);

function RevenueOverview({ totals }: { totals: RevenueTotals }) {
  const total = totals.basic + totals.premium + totals.custom;
  const percent = (value: number) => total > 0 ? `${String(Math.round((value / total) * 100))}%` : "—";
  return (
    <section className="space-y-6">
      <div className="space-y-1"><Kicker>Financial Performance</Kicker><SectionTitle>Revenue Overview</SectionTitle></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <Stat label="Total Revenue" value={`Rs. ${total.toLocaleString()}`} hint="All plans" />
        <Stat label="Basic" value={`Rs. ${totals.basic.toLocaleString()}`} hint={percent(totals.basic)} />
        <Stat label="Premium" value={`Rs. ${totals.premium.toLocaleString()}`} hint={percent(totals.premium)} />
        <Stat label="Custom" value={`Rs. ${totals.custom.toLocaleString()}`} hint={percent(totals.custom)} />
      </div>
    </section>
  );
}

export default function Analytics() {
  const [totals, setTotals] = useState<RevenueTotals>(EMPTY_TOTALS);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<MonthlyRevenue[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const [totalRes, monthlyRes, snapshotRes] = await Promise.all([
          apiFetch(`${API_BASE}/analytics/total-revenue`),
          apiFetch(`${API_BASE}/analytics/monthly-revenue`),
          apiFetch(`${API_BASE}/analytics/network-snapshot`),
        ]);
        setTotals(parseTotals(await totalRes.json()));
        setMonthlyRevenueData(parseMonthlyRevenue(await monthlyRes.json()));
        setNetworkStats(parseNetworkStats(await snapshotRes.json()));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Analytics failed to load");
      } finally {
        setLoading(false);
      }
    };
    void loadAnalytics();
  }, []);

  const downloadPdf = () => {
    const document = new jsPDF();
    const total = totals.basic + totals.premium + totals.custom;
    document.setFontSize(18);
    document.text("Kosh Analytics Report", 14, 18);
    document.setFontSize(10);
    document.text(`Generated ${formatDualDate(todayInNepal())}`, 14, 25);
    autoTable(document, {
      startY: 31,
      head: [["Plan", "Revenue"]],
      body: [["Basic", totals.basic], ["Premium", totals.premium], ["Custom", totals.custom], ["Total", total]],
    });
    autoTable(document, {
      head: [["Month", "Basic", "Premium", "Custom", "Total"]],
      body: monthlyRevenueData.map((row) => [row.month, row.basic ?? 0, row.premium ?? 0, row.custom ?? 0, (row.basic ?? 0) + (row.premium ?? 0) + (row.custom ?? 0)]),
    });
    document.text(`Networks: ${String(networkStats.networks)}  Admins: ${String(networkStats.admins)}  Members: ${String(networkStats.members)}`, 14, document.internal.pageSize.getHeight() - 18);
    document.save("kosh-analytics.pdf");
  };

  return (
    <div className="min-h-screen bg-white relative">
      <button onClick={downloadPdf} className="fixed bottom-20 right-6 md:bottom-6 md:right-6 h-12 w-12 rounded-full bg-gray-900 text-white shadow-lg hover:bg-gray-800" title="Download PDF">↓</button>
      <div className="px-3 md:px-10 py-6 md:py-10 space-y-8 md:space-y-12 max-w-[1200px] mx-auto">
        {error && <p className="text-red-600" role="alert">{error}</p>}
        <RevenueOverview totals={totals} />
        <Divider />
        <section className="space-y-4">
          <div className="space-y-1"><Kicker>Trends</Kicker><SectionTitle>Monthly Revenue</SectionTitle></div>
          <div className="border border-gray-200 rounded-md p-4"><AnalyticsChart monthlyData={monthlyRevenueData} /></div>
        </section>
        <Divider />
        <section className="space-y-4 max-w-3xl">
          <div className="space-y-1"><Kicker>Interpretation</Kicker><SectionTitle>Executive Summary</SectionTitle></div>
          <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{loading ? "Generating report narrative…" : generateSummary(monthlyRevenueData, totals)}</p>
        </section>
      </div>
    </div>
  );
}
