import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  UsersIcon,
  FileTextIcon,
  BanknotesIcon,
  ActivityIcon,
} from "../../component/icons.jsx";
import AdminChart from "../../component/admin/AdminChart";

const apiBase = "http://localhost:8080/api";

function AdminDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    users: 0,
    transactions: 0,
    totalPool: 0,
    savings: 0,
    fixedDeposit: 0,
    credit: 0,
    reserve: 0,
  });

  const [todaysSummary, setTodaysSummary] = useState({
    newUsers: 0,
    txCount: 0,
    totalAmount: 0,
  });

  const [loading, setLoading] = useState(false);

  const formatCurrency = (amount) => {
    const n = Number(amount || 0);
    return "Rs. " + n.toLocaleString("en-IN");
  };

  const formatCompactNumber = (number) => {
    return new Intl.NumberFormat("en-IN", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(Number(number || 0));
  };

  const getTxDirection = (tx) => {
    const raw =
      tx?.direction ??
      tx?.details?.direction ??
      tx?.details?.Direction ??
      tx?.details?.dir ??
      "";
    return String(raw).trim().toLowerCase(); // "credit" | "debit"
  };

  const isCreditTx = (tx) => getTxDirection(tx) === "credit";

  const getTxAmount = (tx) => {
    const val = tx?.amount ?? tx?.amountValue ?? 0;
    return Number(val || 0);
  };

  const getTxDateString = (tx) => {
    return String(tx?.date ?? "").slice(0, 10);
  };

  const todayStr = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetch(`${apiBase}/analytics/admin/stats`, {
        method: "GET",
        credentials: "include",
      });

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);

        if (statsData?.todaysSummary) {
          setTodaysSummary({
            newUsers: statsData.todaysSummary.newUsers || 0,
            txCount: statsData.todaysSummary.txCount || 0,
            totalAmount: statsData.todaysSummary.totalAmount || 0,
          });
        }
      }

      const txRes = await fetch(`${apiBase}/transactions`, {
        method: "GET",
        credentials: "include",
      });

      if (txRes.ok) {
        const txData = await txRes.json();
        const txArray = Array.isArray(txData) ? txData : [];
        setTransactions(txArray);

      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const netTotalPool =
    (stats.savings || 0) + (stats.fixedDeposit || 0) - (stats.credit || 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pool */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Total Pool
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCompactNumber(netTotalPool)}
              </p>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Assets Managed
              </p>
            </div>
          </div>
        </div>

        {/* Users */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Active Users
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.users}</p>
              <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                <UsersIcon className="w-3 h-3" />
                <span>Members</span>
              </p>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Transactions
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.transactions}</p>
              <p className="text-xs text-gray-500 mt-2">All time volume</p>
            </div>
          </div>
        </div>

        {/* Deposits (Sum of Savings + FD) */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Total Deposits
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCompactNumber((stats.savings || 0) + (stats.fixedDeposit || 0))}
              </p>
              <p className="text-xs text-blue-600 mt-2">Savings + FD</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT ROW --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart Section */}
          <div className="bg-white rounded-xl border border-gray-100 p-3 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Financial Overview</h2>
                <p className="text-sm text-gray-500">Distribution of network funds</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="flex justify-center">
                <div className="w-full max-w-[300px]">
                  <AdminChart
                    data={{
                      savings: stats.savings,
                      fd: stats.fixedDeposit,
                      credit: stats.credit,
                      reserve: stats.reserve,
                    }}
                  />
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
                    <span className="text-sm font-medium text-gray-700">Savings (Liquid)</span>
                  </div>
                  <span className="font-bold text-gray-900">{formatCurrency(stats.savings)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50/50 border border-indigo-100">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm"></div>
                    <span className="text-sm font-medium text-gray-700">
                      Fixed Deposit (Locked)
                    </span>
                  </div>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(stats.fixedDeposit)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50/50 border border-purple-100">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-purple-500 shadow-sm"></div>
                    <span className="text-sm font-medium text-gray-700">Loans (Credit)</span>
                  </div>
                  <span className="font-bold text-gray-900">{formatCurrency(stats.credit)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></div>
                    <span className="text-sm font-medium text-gray-700">Liquidity Reserve</span>
                  </div>
                  <span className="font-bold text-gray-900">{formatCurrency(stats.reserve)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
              <Link
                to="/admin/transactions"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 uppercase tracking-wide"
              >
                View All
              </Link>
            </div>

            <div>
              {loading ? (
                <div className="p-12 text-center">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-xs text-gray-400">Loading data...</p>
                </div>
              ) : transactions.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {transactions.slice(0, 5).map((tx) => {
                    const credit = isCreditTx(tx);
                    const amt = getTxAmount(tx);
                    const dateStr = getTxDateString(tx);

                    return (
                      <div
                        key={tx.id}
                        className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${credit
                                ? "bg-emerald-100 text-emerald-600"
                                : "bg-red-100 text-red-600"
                              }`}
                          >
                            <BanknotesIcon className="w-5 h-5" />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {tx.userName || "System"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {dateStr} • {tx.type}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p
                            className={`text-sm font-bold ${credit ? "text-emerald-600" : "text-red-600"
                              }`}
                          >
                            {credit ? "+" : "-"} {formatCurrency(amt)}
                          </p>
                          <p className="text-xs text-gray-400">{tx.status}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center text-gray-400">
                  <FileTextIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No transactions found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-100 p-3 md:p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link to="/admin/transactions" className="block w-full">
                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left">
                  <div className="p-2 bg-gray-100 rounded-md group-hover:bg-emerald-100 transition-colors">
                    <BanknotesIcon className="w-5 h-5 text-gray-600 group-hover:text-emerald-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Add Transaction</span>
                </button>
              </Link>

              <Link to="/admin/users" className="block w-full">
                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left">
                  <div className="p-2 bg-gray-100 rounded-md group-hover:bg-emerald-100 transition-colors">
                    <UsersIcon className="w-5 h-5 text-gray-600 group-hover:text-emerald-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Manage Users</span>
                </button>
              </Link>

              <Link to="/admin/packages" className="block w-full">
                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left">
                  <div className="p-2 bg-gray-100 rounded-md group-hover:bg-emerald-100 transition-colors">
                    <FileTextIcon className="w-5 h-5 text-gray-600 group-hover:text-emerald-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Create Package</span>
                </button>
              </Link>

              <Link to="/admin/history" className="block w-full">
                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left">
                  <div className="p-2 bg-gray-100 rounded-md group-hover:bg-emerald-100 transition-colors">
                    <ActivityIcon className="w-5 h-5 text-gray-600 group-hover:text-emerald-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">View History</span>
                </button>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-3 md:p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Today's Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">New Users</span>
                <span className="text-lg font-bold text-gray-900">{todaysSummary.newUsers}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Transactions</span>
                <span className="text-lg font-bold text-gray-900">{todaysSummary.txCount}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Total Volume</span>
                <span className="text-lg font-bold text-emerald-600">
                  {formatCompactNumber(todaysSummary.totalAmount)}
                </span>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">System Status</span>
                  <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    Operational
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;