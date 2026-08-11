import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { API_BASE, apiFetch } from "../../lib/apiClient";
import { parseNetworks } from "../../lib/networks";
import { isRecord } from "../../lib/validation";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B"];
const chartColor = (index: number): string => COLORS[index % COLORS.length] ?? "#3B82F6";

/* ----------------------------- UI Primitives ----------------------------- */

interface NetworkStats {
  total: number;
  totalBasic: number;
  totalPremium: number;
  totalCustom: number;
  totalUsers: number;
  activeUsers: number;
}
interface PieDatum { name: string; value: number; fill: string }
interface GrowthDatum { date: string; users: number }
interface RecentNetwork { name: string; type: string; value: string; date: string }

function numberField(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function parseStats(value: unknown): NetworkStats {
  if (!isRecord(value)) throw new Error("Invalid network statistics response");
  return {
    total: numberField(value, "total"), totalBasic: numberField(value, "totalBasic"),
    totalPremium: numberField(value, "totalPremium"), totalCustom: numberField(value, "totalCustom"),
    totalUsers: numberField(value, "totalUsers"), activeUsers: numberField(value, "activeUsers"),
  };
}

const Kicker = ({ children }: { children: ReactNode }) => (
  <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-1">
    {children}
  </p>
);

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="text-lg font-medium text-gray-900">{children}</h2>
);

const Divider = () => <div className="border-t border-gray-200 my-10" />;

const Stat = ({ label, value, hint, trend }: { label: string; value: number; hint?: string; trend?: string }) => (
  <div className="space-y-1">
    <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
    <p className="text-2xl font-semibold text-gray-900">{value}</p>
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
    {trend && (
      <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-1 rounded-full bg-blue-500" style={{ width: trend }}></div>
      </div>
    )}
  </div>
);

/* ----------------------------- Sections ----------------------------- */

const MetricsOverview = ({ networkStats }: { networkStats: NetworkStats }) => (
  <section className="space-y-6">
    <div className="space-y-1">
      <Kicker>Platform Overview</Kicker>
      <SectionTitle>Key Metrics</SectionTitle>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
      <Stat
        label="Total Networks"
        value={networkStats.total || 0}
        hint="All types"
      />
      <Stat
        label="Basic"
        value={networkStats.totalBasic || 0}
        hint="Entry tier"
      />
      <Stat
        label="Premium"
        value={networkStats.totalPremium || 0}
        hint="Mid tier"
      />
      <Stat
        label="Custom"
        value={networkStats.totalCustom || 0}
        hint="Enterprise"
      />
      <Stat
        label="Total Users"
        value={networkStats.totalUsers || 0}
        hint="Registered"
      />
      <Stat
        label="Active Users"
        value={networkStats.activeUsers || 0}
        hint="Currently active"
        trend="65%"
      />
    </div>
  </section>
);

const NetworkDistribution = ({ networkPieData }: { networkPieData: PieDatum[] }) => (
  <section className="space-y-4">
    <div className="space-y-1">
      <Kicker>Distribution</Kicker>
      <SectionTitle>Network Types</SectionTitle>
    </div>

    <div className="border border-gray-200 rounded-lg p-3 md:p-6 bg-white">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={networkPieData}
            dataKey="value"
            nameKey="name"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
          />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex justify-center gap-6 mt-4">
        {networkPieData.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.fill }}
            />
            <span className="text-sm text-gray-600">{entry.name}</span>
            <span className="text-sm font-semibold text-gray-900">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const UserGrowthTrend = ({ activeUsersData }: { activeUsersData: GrowthDatum[] }) => (
  <section className="space-y-4">
    <div className="space-y-1">
      <Kicker>Growth</Kicker>
      <SectionTitle>Active Users Over Time</SectionTitle>
    </div>

    <div className="border border-gray-200 rounded-lg p-3 md:p-6 bg-white">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={activeUsersData}
          margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '12px'
            }}
          />
          <Line
            type="monotone"
            dataKey="users"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: '#3B82F6', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </section>
);

const RecentNetworksTable = ({ recentNetworks }: { recentNetworks: RecentNetwork[] }) => (
  <section className="space-y-4">
    <div className="space-y-1">
      <Kicker>Recent Activity</Kicker>
      <SectionTitle>Recently Added Networks</SectionTitle>
    </div>

    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[600px] w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                Network Name
              </th>
              <th className="text-left px-6 py-3 text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                Type
              </th>
              <th className="text-left px-6 py-3 text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                Value
              </th>
              <th className="text-left px-6 py-3 text-[11px] uppercase tracking-wide text-gray-500 font-medium">
                Date Added
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {recentNetworks.length > 0 ? (
              recentNetworks.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {row.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${row.type === 'Basic' ? 'bg-blue-50 text-blue-700' :
                      row.type === 'Premium' ? 'bg-green-50 text-green-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                      {row.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {row.value}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {row.date}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">
                  No recent networks
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);

const QuickActions = ({ onNetworks, onAnalytics }: { onNetworks: () => void; onAnalytics: () => void }) => (
  <section className="space-y-4">
    <div className="space-y-1">
      <Kicker>Quick Access</Kicker>
      <SectionTitle>Actions</SectionTitle>
    </div>

    <div className="border border-gray-200 rounded-lg p-3 md:p-6 bg-white space-y-3">
      <button onClick={onNetworks} className="w-full text-left px-4 py-3 rounded-md bg-gray-50 hover:bg-gray-100 transition text-sm font-medium text-gray-900">
        Manage Networks
      </button>
      <button onClick={onAnalytics} className="w-full text-left px-4 py-3 rounded-md bg-gray-50 hover:bg-gray-100 transition text-sm font-medium text-gray-900">
        View Analytics
      </button>
    </div>
  </section>
);

/* ----------------------------- Main Dashboard ----------------------------- */

export default function SuperadminDashboard() {
  const navigate = useNavigate();
  const [networkStats, setNetworkStats] = useState<NetworkStats>({ total: 0, totalBasic: 0, totalPremium: 0, totalCustom: 0, totalUsers: 0, activeUsers: 0 });
  const [recentNetworks, setRecentNetworks] = useState<RecentNetwork[]>([]);
  const [activeUsersData, setActiveUsersData] = useState<GrowthDatum[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsResponse, recentResponse, usersResponse] = await Promise.all([
          apiFetch(`${API_BASE}/networks/stats`), apiFetch(`${API_BASE}/networks/recent`), apiFetch(`${API_BASE}/users/all`),
        ]);
        setNetworkStats(parseStats(await statsResponse.json()));
        const networks = parseNetworks(await recentResponse.json());
        setRecentNetworks(
          networks.map((net) => ({
            name: net.name,
            type: net.packageType,
            value: `Rs. ${net.packagePrice.toLocaleString()}`,
            date: new Date(net.createdAt).toLocaleDateString("en-GB"),
          }))
        );
        const users: unknown = await usersResponse.json();
        if (!Array.isArray(users)) throw new Error("Invalid users response");
        const map: Record<string, number> = {};
        users.filter(isRecord).forEach((user) => {
          if (user.status === "Active") {
            const date = typeof user.createdAt === "string" && user.createdAt
              ? new Date(user.createdAt).toLocaleDateString("en-GB")
              : "Unknown";
            map[date] = (map[date] || 0) + 1;
          }
        });
        const chartData = Object.entries(map)
          .map(([date, users]) => ({ date, users }))
          .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
        setActiveUsersData(chartData);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Dashboard data failed to load");
      }
    };
    void load();
  }, []);

  const networkPieData = [
    { name: "Basic", value: networkStats.totalBasic, fill: chartColor(0) },
    { name: "Premium", value: networkStats.totalPremium, fill: chartColor(1) },
    { name: "Custom", value: networkStats.totalCustom, fill: chartColor(2) },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="px-3 md:px-10 py-6 md:py-10 space-y-8 md:space-y-12 max-w-[1400px] mx-auto">

        {error && <p className="text-red-600" role="alert">{error}</p>}

        <MetricsOverview networkStats={networkStats} />

        <Divider />

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-10">
          <NetworkDistribution networkPieData={networkPieData} />
          <UserGrowthTrend activeUsersData={activeUsersData} />
        </div>

        <Divider />

        {/* Bottom Grid */}
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <RecentNetworksTable recentNetworks={recentNetworks} />
          </div>
          <div>
            <QuickActions onNetworks={() => { void navigate("/superadmin/networks"); }} onAnalytics={() => { void navigate("/superadmin/analytics"); }} />
          </div>
        </div>
      </div>
    </div>
  );
}
