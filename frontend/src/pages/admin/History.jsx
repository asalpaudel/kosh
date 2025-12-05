import React, { useState, useEffect } from 'react';
import { SearchIcon } from '../../component/icons.jsx';

const API_BASE = "http://localhost:8080/api";

function AdminHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/history/admin`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setLogs(data);
        } else {
          console.error("Failed to fetch history");
        }
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // --- NEW: Helper to parse and format the raw log message ---
  const formatLogDetails = (log) => {
    const detail = log.details || "";

    // Check if this is a transaction log (contains "Rs.")
    if (log.action === 'ADD_TRANSACTION' && detail.includes("Rs.")) {
      
      // Regex to find "Rs." followed by an optional negative sign and numbers
      // Matches strings like: "Rs. -2000.0", "Rs. 5000", "Rs.-400"
      const match = detail.match(/Rs\.\s*(-?[\d,]+(\.\d+)?)/);

      if (match) {
        // match[1] contains the number with the sign (e.g., "-2000.0")
        const rawAmountStr = match[1].replace(/,/g, ''); 
        const amount = parseFloat(rawAmountStr);

        if (!isNaN(amount)) {
          const isWithdrawn = amount < 0;
          const absAmount = Math.abs(amount).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });

          // Helper to extract user name (everything after " for ")
          const forSplit = detail.split(" for ");
          const userName = forSplit.length > 1 ? forSplit[1] : "";

          // Helper to extract type (text between "Added " and " transaction")
          let txType = "Transaction";
          const typeMatch = detail.match(/Added\s+(.*?)\s+transaction/);
          if (typeMatch && typeMatch[1]) {
            txType = typeMatch[1];
          }

          // Return formatted JSX
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

    // Fallback for non-transaction logs
    return <span className="text-gray-700">{detail}</span>;
  };

  const filteredLogs = logs.filter(log => 
    log.actorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionStyle = (action) => {
    const act = action?.toUpperCase();
    if (act === 'LOGIN') return 'bg-green-100 text-green-700 border-green-200';
    if (act === 'LOGOUT') return 'bg-gray-100 text-gray-600 border-gray-200';
    if (act === 'ADD_TRANSACTION') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (act === 'CREATE_USER') return 'bg-purple-100 text-purple-700 border-purple-200';
    if (act === 'APPROVE_USER') return 'bg-teal-100 text-teal-700 border-teal-200';
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
    <div className="bg-white p-6 min-h-[calc(100vh-8.5rem)] rounded-lg shadow-md"> 
      
      <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Activity Log</h2>
        
        <div className="relative flex-grow sm:flex-grow-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search activity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 bg-gray-100 text-gray-700 border border-transparent rounded-full py-3 pl-11 pr-4 text-sm focus:outline-none focus:bg-white focus:border-gray-300 transition-colors"
          />
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-lg border border-gray-100">
        <table className="min-w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
              <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Admin / Actor</th>
              <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
              <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="4" className="py-8 text-center text-gray-500">Loading activities...</td>
              </tr>
            ) : filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 text-gray-600 text-sm whitespace-nowrap">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-semibold text-gray-900">{log.actorName}</div>
                    <div className="text-xs text-gray-500 capitalize">{log.role}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getActionStyle(log.action)}`}>
                      {log.action?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm">
                    {/* Render the formatted detail here */}
                    {formatLogDetails(log)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="py-8 text-center text-gray-500">No activity logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}

export default AdminHistory;