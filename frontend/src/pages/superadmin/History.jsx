import React, { useState, useEffect } from 'react';
import { SearchIcon } from '../../component/icons.jsx';

const API_BASE = "http://localhost:8080/api";

function History() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/history/superadmin`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatLogDetails = (log) => {
    const detail = log.details || "";

    // Check if this is a transaction log (contains "Rs.")
    if (log.action === 'ADD_TRANSACTION' && detail.includes("Rs.")) {
      const match = detail.match(/Rs\.\s*(-?[\d,]+(\.\d+)?)/);

      if (match) {
        const rawAmountStr = match[1].replace(/,/g, '');
        const amount = parseFloat(rawAmountStr);

        if (!isNaN(amount)) {
          const isWithdrawn = amount < 0;
          const absAmount = Math.abs(amount).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });

          const forSplit = detail.split(" for ");
          const userName = forSplit.length > 1 ? forSplit[1] : "";

          let txType = "Transaction";
          const typeMatch = detail.match(/Added\s+(.*?)\s+transaction/);
          if (typeMatch && typeMatch[1]) {
            txType = typeMatch[1];
          }

          if (isWithdrawn) {
            return (
              <span>
                <span className="font-bold text-red-600">Withdrawn</span>
                <span className="text-gray-900 font-medium"> Rs. {absAmount}</span>
                <span className="text-gray-500 text-xs ml-1">({txType})</span>
                {userName && <span className="text-gray-600"> for {userName}</span>}
              </span>
            );
          } else {
            return (
              <span>
                <span className="font-bold text-green-600">Deposited</span>
                <span className="text-gray-900 font-medium"> Rs. {absAmount}</span>
                <span className="text-gray-500 text-xs ml-1">({txType})</span>
                {userName && <span className="text-gray-600"> for {userName}</span>}
              </span>
            );
          }
        }
      }
    }

    return <span className="text-gray-700">{detail}</span>;
  };

  const filteredLogs = logs.filter(log =>
    log.actorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionStyle = (action) => {
    const act = action?.toUpperCase();
    if (act === 'LOGIN') return 'bg-green-50 text-green-700 border-green-200';
    if (act === 'LOGOUT') return 'bg-gray-50 text-gray-500 border-gray-200';
    if (act === 'CREATE_NETWORK') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (act === 'DELETE_NETWORK') return 'bg-red-50 text-red-700 border-red-200';
    if (act === 'UPDATE_NETWORK') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (act === 'ADD_TRANSACTION') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="bg-white p-6 min-h-[calc(100vh-8.5rem)] rounded-2xl shadow-sm border border-gray-100">

      <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">System Activity Logs</h2>
          <p className="text-sm text-gray-500 mt-1">Audit trail for all platform-wide actions</p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-grow">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4">
              <SearchIcon className="h-4 w-4 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-72 bg-gray-50 text-gray-700 border border-gray-100 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-300 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={fetchHistory}
            className="bg-indigo-600 text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-indigo-700 transition-all text-sm shadow-sm active:scale-95"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
        <table className="min-w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Timestamp</th>
              <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Actor</th>
              <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
              <th className="py-4 px-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Event Details</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan="4" className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-3 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-400 font-medium">Syncing database logs...</span>
                  </div>
                </td>
              </tr>
            ) : filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="py-5 px-6 text-gray-500 text-xs font-mono whitespace-nowrap">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="py-5 px-6">
                    <div className="font-semibold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">
                      {log.actorName || "System Agent"}
                    </div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{log.role || "N/A"}</div>
                  </td>
                  <td className="py-5 px-6">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all ${getActionStyle(log.action)}`}>
                      {log.action?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-sm">
                    {formatLogDetails(log)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="py-20 text-center">
                  <div className="text-gray-300 mb-2">
                    <svg className="w-12 h-12 mx-auto opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm italic">No system activity found matching your criteria.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default History;