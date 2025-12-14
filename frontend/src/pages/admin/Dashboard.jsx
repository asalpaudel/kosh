import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CurrencyDollarIcon,
  UsersIcon,
  FileTextIcon,
  BanknotesIcon,
  ActivityIcon,
} from "../../component/icons.jsx";
import NetworkDonutChart from "../../component/superadmin/NetworkDonutChart";

const apiBase = "http://localhost:8080/api";

function AdminDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/transactions`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading transactions:", err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Total Pool
              </p>
              <p className="text-3xl font-bold text-gray-900">1.3M</p>
              <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                <span>↑ 12%</span>
                <span className="text-gray-400">vs last month</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Users
              </p>
              <p className="text-3xl font-bold text-gray-900">234</p>
              <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                <span>+18</span>
                <span className="text-gray-400">this week</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Transactions
              </p>
              <p className="text-3xl font-bold text-gray-900">1,459</p>
              <p className="text-xs text-gray-500 mt-2">This month</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Savings
              </p>
              <p className="text-3xl font-bold text-gray-900">850K</p>
              <p className="text-xs text-gray-500 mt-2">Across accounts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart and Pool Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Network Overview */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Network Overview
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Financial distribution across categories
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Chart */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-[280px]">
                  <NetworkDonutChart />
                </div>
              </div>

              {/* Breakdown */}
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-sm font-medium text-gray-700">
                      Total Pool
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    Rs. 1,30,000
                  </span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium text-gray-700">
                      Savings
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    Rs. 85,000
                  </span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm font-medium text-gray-700">
                      Credit
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    Rs. 30,000
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm font-medium text-gray-700">
                      Reserve
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    Rs. 15,000
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Recent Activity
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Latest 5 transactions
                </p>
              </div>
              <Link
                to="/admin/transactions"
                className="text-sm font-medium text-gray-900 hover:text-emerald-600 flex items-center gap-1 transition-colors"
              >
                View all →
              </Link>
            </div>

            <div>
              {loading ? (
                <div className="p-16 text-center">
                  <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-gray-500">Loading...</p>
                </div>
              ) : transactions.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {transactions
                    .slice()
                    .reverse()
                    .slice(0, 5)
                    .map((tx) => (
                      <div
                        key={tx.id}
                        className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-gray-700">
                              {tx.user?.charAt(0)?.toUpperCase() || "U"}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {tx.user}
                            </p>
                            <p className="text-xs text-gray-500">{tx.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">
                            {tx.amount}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {tx.type}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="p-16 text-center">
                  <FileTextIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No transactions found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link
                to="/admin/transactions"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-emerald-100 transition-colors">
                  <FileTextIcon className="w-4 h-4 text-gray-600 group-hover:text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Add Transaction
                </span>
              </Link>

              <Link
                to="/admin/users"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-emerald-100 transition-colors">
                  <UsersIcon className="w-4 h-4 text-gray-600 group-hover:text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Manage Users
                </span>
              </Link>

              <Link
                to="/admin/packages"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-emerald-100 transition-colors">
                  <BanknotesIcon className="w-4 h-4 text-gray-600 group-hover:text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Create Package
                </span>
              </Link>

              <Link
                to="/admin/history"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-emerald-100 transition-colors">
                  <ActivityIcon className="w-4 h-4 text-gray-600 group-hover:text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  View History
                </span>
              </Link>
            </div>
          </div>

          {/* Activity Summary */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Today's Summary
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">New Users</span>
                <span className="text-lg font-bold text-gray-900">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Transactions</span>
                <span className="text-lg font-bold text-gray-900">24</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Amount</span>
                <span className="text-lg font-bold text-gray-900">
                  Rs. 45,200
                </span>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    All systems operational
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
