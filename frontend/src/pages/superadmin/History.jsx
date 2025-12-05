import React, { useState, useEffect } from 'react';
import { SearchIcon, CalendarIcon } from '../../component/icons.jsx';

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

  const filteredLogs = logs.filter(log => 
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleString('en-GB', { 
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="bg-gray-50 p-6 min-h-screen">
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        
        {/* Header bar */}
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl font-bold text-gray-800">System Logs</h2>
          
          <div className="flex gap-4 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search system events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-100 text-gray-700 border border-transparent rounded-full py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:bg-white focus:border-gray-300 transition-all"
              />
            </div>
            
            <button 
              onClick={fetchHistory}
              className="bg-teal-500 text-white font-bold py-2.5 px-6 rounded-full hover:bg-teal-600 transition-colors text-sm shadow-md"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* History Log List */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-center text-gray-500 py-10">Loading system logs...</p>
          ) : filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-gray-50 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
              >
                {/* Time */}
                <div className="flex items-center gap-2 text-gray-500 text-sm font-mono md:col-span-1">
                  <CalendarIcon className="w-4 h-4 text-teal-500" />
                  {formatDate(log.timestamp)}
                </div>

                {/* Action Badge */}
                <div className="md:col-span-1">
                  <span className={`
                    inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider
                    ${log.action === 'CREATE_NETWORK' ? 'bg-blue-100 text-blue-700' : 
                      log.action === 'LOGIN' ? 'bg-green-100 text-green-700' :
                      log.action === 'LOGOUT' ? 'bg-gray-200 text-gray-600' :
                      'bg-purple-100 text-purple-700'}
                  `}>
                    {log.action?.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Details */}
                <div className="text-gray-700 font-medium md:col-span-2">
                  {log.details}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">No system logs found.</p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}

export default History;