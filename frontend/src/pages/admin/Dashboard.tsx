import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE as apiBase, apiFetch } from "../../lib/apiClient";
import { parseTransactions, type TransactionRecord } from "../../lib/transactions";
import { isRecord } from "../../lib/validation";
import {
  UsersIcon,
  FileTextIcon,
  BanknotesIcon,
  ActivityIcon,
} from "../../component/icons";
import AdminChart from "../../component/admin/AdminChart";


function AdminDashboard() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [stats, setStats] = useState({
    users: 0,
    transactions: 0,
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
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return "Rs. " + amount.toLocaleString("en-IN");
  };

  const formatCompactNumber = (number: number) => {
    return new Intl.NumberFormat("en-IN", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(number);
  };

  // Helper to check transaction direction for list display
  const getTxDirection = (tx: TransactionRecord) => {
    const raw = tx.direction;
    const type = tx.type;
    if (raw === "Credit" || type.includes("Credit") || type.includes("Deposit"))
      return "credit";
    return "debit";
  };

  const isCreditTx = (tx: TransactionRecord) => getTxDirection(tx) === "credit";

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch User Stats & Today's Summary (Keep Backend logic for user counts)
      const statsRes = await apiFetch(`${apiBase}/analytics/admin/stats`);
      const backendStats: unknown = await statsRes.json();
      let userCount = 0;
      let transactionCount = 0;
      if (isRecord(backendStats)) {
        userCount = typeof backendStats.users === "number" ? backendStats.users : 0;
        transactionCount = typeof backendStats.transactions === "number" ? backendStats.transactions : 0;
        if (isRecord(backendStats.todaysSummary)) {
          const summary = backendStats.todaysSummary;
          setTodaysSummary({
            newUsers: typeof summary.newUsers === "number" ? summary.newUsers : 0,
            txCount: typeof summary.txCount === "number" ? summary.txCount : 0,
            totalAmount: typeof summary.totalAmount === "number" ? summary.totalAmount : 0,
          });
        }
      }

      // 2. Fetch Transactions to Recalculate Financials (Frontend Override)
      const txRes = await apiFetch(`${apiBase}/transactions`);
        const txArray = parseTransactions(await txRes.json());
        setTransactions(txArray);

        // ⭐ RECALCULATE FINANCIALS FROM TRANSACTIONS ⭐
        let calcSavings = 0;
        let calcFD = 0;
        let calcLoans = 0;
        let calcNetwork = 0; // Equity/Capital

        txArray.forEach((tx) => {
          const amt = tx.amount;
          const head = tx.accountHead;
          const direction = tx.direction;
          const type = tx.type;

          // Savings (Liability to Bank)
          if (head.includes("Savings") || type.includes("Savings")) {
            // Credit = User Deposit = Bank Liability Increases (+)
            // Debit = User Withdraw = Bank Liability Decreases (-)
            if (direction === "Credit" || type.includes("Deposit"))
              calcSavings += amt;
            else if (direction === "Debit" || type.includes("Withdraw"))
              calcSavings -= amt;
          }

          // Fixed Deposit (Liability to Bank)
          if (
            head.includes("Fixed Deposit") ||
            type.includes("Fixed Deposit")
          ) {
            if (direction === "Credit" || type.includes("Deposit"))
              calcFD += amt;
            else if (direction === "Debit" || type.includes("Withdraw"))
              calcFD -= amt;
          }

          // Loans (Asset to Bank)
          if (head.includes("Loan") || type.includes("Loan")) {
            // Debit = Disbursement = Bank Asset Increases (+)
            // Credit = Repayment = Bank Asset Decreases (-)
            if (direction === "Debit" || type.includes("Disbursement"))
              calcLoans += amt;
            else if (direction === "Credit" || type.includes("Repayment"))
              calcLoans -= amt;
          }

          // Network Capital (Equity)
          if (tx.userId === null) {
            // Credit to Network = Income/Equity Increase
            // Debit to Network = Expense/Equity Decrease
            if (direction === "Credit") calcNetwork += amt;
            else if (direction === "Debit") calcNetwork -= amt;
          }
        });

        // Reserve = (Savings + FD) - Loans + NetworkCapital
        // (Liquidity Model: Total Cash In - Cash Out)
        // Note: This matches the Controller logic found in TransactionController
        const calcReserve = calcSavings + calcFD - calcLoans + calcNetwork;

        setStats((prev) => ({
          ...prev,
          users: userCount,
          transactions: transactionCount,
          savings: Math.max(0, calcSavings),
          fixedDeposit: Math.max(0, calcFD),
          credit: Math.max(0, calcLoans),
          reserve: calcReserve,
        }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Dashboard failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const netTotalPool = stats.savings + stats.fixedDeposit;

  return (
    <div className="space-y-6">
      {error && <p className="text-red-600" role="alert">{error}</p>}
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
              <p className="text-2xl font-bold text-gray-900">
                {stats.transactions}
              </p>
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
                {formatCompactNumber(
                  (stats.savings || 0) + (stats.fixedDeposit || 0),
                )}
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
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Financial Overview
                </h2>
                <p className="text-sm text-gray-500">
                  Distribution of network funds
                </p>
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
                    }}
                  />
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
                    <span className="text-sm font-medium text-gray-700">
                      Savings (Liquid)
                    </span>
                  </div>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(stats.savings)}
                  </span>
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
                    <span className="text-sm font-medium text-gray-700">
                      Loans (Credit)
                    </span>
                  </div>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(stats.credit)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></div>
                    <span className="text-sm font-medium text-gray-700">
                      Liquidity Reserve
                    </span>
                  </div>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(stats.reserve)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">
                Recent Activity
              </h2>
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
                    const amt = tx.amount;
                    const dateStr = tx.date.slice(0, 10);

                    return (
                      <div
                        key={tx.id}
                        className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              credit
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
                            className={`text-sm font-bold ${
                              credit ? "text-emerald-600" : "text-red-600"
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
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link to="/admin/transactions" className="block w-full">
                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left">
                  <div className="p-2 bg-gray-100 rounded-md group-hover:bg-emerald-100 transition-colors">
                    <BanknotesIcon className="w-5 h-5 text-gray-600 group-hover:text-emerald-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    Add Transaction
                  </span>
                </button>
              </Link>

              <Link to="/admin/users" className="block w-full">
                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left">
                  <div className="p-2 bg-gray-100 rounded-md group-hover:bg-emerald-100 transition-colors">
                    <UsersIcon className="w-5 h-5 text-gray-600 group-hover:text-emerald-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    Manage Users
                  </span>
                </button>
              </Link>

              <Link to="/admin/packages" className="block w-full">
                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left">
                  <div className="p-2 bg-gray-100 rounded-md group-hover:bg-emerald-100 transition-colors">
                    <FileTextIcon className="w-5 h-5 text-gray-600 group-hover:text-emerald-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    Create Package
                  </span>
                </button>
              </Link>

              <Link to="/admin/history" className="block w-full">
                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left">
                  <div className="p-2 bg-gray-100 rounded-md group-hover:bg-emerald-100 transition-colors">
                    <ActivityIcon className="w-5 h-5 text-gray-600 group-hover:text-emerald-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    View History
                  </span>
                </button>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Today's Summary
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">New Users</span>
                <span className="text-lg font-bold text-gray-900">
                  {todaysSummary.newUsers}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Transactions</span>
                <span className="text-lg font-bold text-gray-900">
                  {todaysSummary.txCount}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Total Volume</span>
                <span className="text-lg font-bold text-emerald-600">
                  {formatCompactNumber(todaysSummary.totalAmount)}
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
