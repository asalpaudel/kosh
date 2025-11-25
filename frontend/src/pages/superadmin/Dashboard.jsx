import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const API_BASE = "http://localhost:8080/api";
const COLORS = ["#3B82F6", "#10B981", "#FBBF24"];

const StatCard = ({ title, value, icon, trend }) => (
  <div className="bg-white p-5 rounded-2xl shadow hover:shadow-lg transition flex flex-col">
    <div className="flex justify-between items-center mb-2">
      <p className="text-gray-500 font-medium">{title}</p>
      <div className="text-2xl">{icon}</div>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    {trend && (
      <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-2 rounded-full bg-blue-500 w-1/2"></div>
      </div>
    )}
  </div>
);

const TableRow = ({ name, type, value, date }) => (
  <div className="grid grid-cols-4 gap-4 py-3 border-b hover:bg-gray-50 transition">
    <p className="font-medium text-gray-900">{name}</p>
    <p className="text-gray-700">{type}</p>
    <p className="font-semibold text-gray-900">{value}</p>
    <p className="text-gray-500">{date}</p>
  </div>
);

export default function SuperadminDashboard() {
  const [networkStats, setNetworkStats] = useState({});
  const [recentNetworks, setRecentNetworks] = useState([]);
  const [activeUsersData, setActiveUsersData] = useState([]);

  useEffect(() => {
    // Fetch network stats
    fetch(`${API_BASE}/networks/stats`)
      .then((res) => res.json())
      .then((data) => setNetworkStats(data))
      .catch(console.error);

    // Fetch recent networks
    fetch(`${API_BASE}/networks/recent`)
      .then((res) => res.json())
      .then((data) => {
        setRecentNetworks(
          data.map((net) => ({
            name: net.name,
            type: net.packageType,
            value: `Rs. ${net.packagePrice.toLocaleString()}`,
            date: new Date(net.createdAt).toLocaleDateString("en-GB"),
          }))
        );
      })
      .catch(console.error);

    // Fetch active users
    fetch(`${API_BASE}/users/all`)
      .then((res) => res.json())
      .then((users) => {
        const map = {};
        users.forEach((u) => {
          if (u.status === "Active") {
            const date = u.createdAt
              ? new Date(u.createdAt).toLocaleDateString("en-GB")
              : "Unknown";
            map[date] = (map[date] || 0) + 1;
          }
        });
        const chartData = Object.entries(map)
          .map(([date, users]) => ({ date, users }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setActiveUsersData(chartData);
      })
      .catch(console.error);
  }, []);

  const networkPieData = [
    { name: "Basic", value: networkStats.totalBasic || 0 },
    { name: "Premium", value: networkStats.totalPremium || 0 },
    { name: "Custom", value: networkStats.totalCustom || 0 },
  ];

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 mb-6">
        <StatCard
          title="Total Networks"
          value={networkStats.total || 0}
          icon="🌐"
        />
        <StatCard
          title="Basic Networks"
          value={networkStats.totalBasic || 0}
          icon="💠"
        />
        <StatCard
          title="Premium Networks"
          value={networkStats.totalPremium || 0}
          icon="💎"
        />
        <StatCard
          title="Custom Networks"
          value={networkStats.totalCustom || 0}
          icon="⚙️"
        />
        <StatCard
          title="Total Users"
          value={networkStats.totalUsers || 0}
          icon="👥"
        />
        <StatCard
          title="Active Users"
          value={networkStats.activeUsers || 0}
          icon="✅"
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Network Pie */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Network Types
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={networkPieData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={100}
                label
              >
                {networkPieData.map((entry, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => `Rs. ${val}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Active Users Line */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Active Users Over Time
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={activeUsersData}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <XAxis dataKey="date" />
              <YAxis />
              <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#3B82F6"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Networks + Shortcuts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Networks */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900">
            Recently Added Networks
          </h3>
          <div className="grid grid-cols-4 gap-4 pb-2 border-b text-gray-500 font-semibold text-sm">
            <span>Name</span>
            <span>Type</span>
            <span>Value</span>
            <span>Date</span>
          </div>
          <div>
            {recentNetworks.map((row, idx) => (
              <TableRow key={idx} {...row} />
            ))}
          </div>
        </div>

        {/* Shortcuts */}
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-3">
          <h3 className="text-lg font-bold mb-4 text-gray-900">Shortcuts</h3>
          <button className="w-full text-left font-medium text-blue-600 hover:underline">
            Add New Network
          </button>
          <button className="w-full text-left font-medium text-blue-600 hover:underline">
            Manage Users
          </button>
          <button className="w-full text-left font-medium text-blue-600 hover:underline">
            System Settings
          </button>
        </div>
      </div>
    </div>
  );
}
