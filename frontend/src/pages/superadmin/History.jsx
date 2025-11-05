import React from 'react';
import { SearchIcon } from '../../component/icons.jsx'; // Make sure icons.jsx is at this path

function History() {
  
  // Mock data for the history log
  const historyLogs = [
    {
      date: '13-Apr-2025',
      action: 'network Added',
      details: 'Geda Sahakari (Basic)'
    },
    {
      date: '13-Apr-2025',
      action: 'network deleted',
      details: 'Old Network (Custom)'
    },
    {
      date: '12-Apr-2025',
      action: 'user approved',
      details: 'user@example.com'
    },
    {
      date: '12-Apr-2025',
      action: 'settings updated',
      details: 'System-wide interest rate'
    },
    {
      date: '11-Apr-2025',
      action: 'admin login',
      details: 'superadmin@example.com'
    },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg min-h-[80vh]">
      <div className="container mx-auto">
        
        {/* Header bar */}
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          
          {/* Search Input */}
          <div className="relative flex-grow sm:flex-grow-0">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4">
              <SearchIcon className="h-6 w-6 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search history..."
              className="w-full sm:w-80 bg-gray-100 text-gray-700 border border-transparent rounded-full py-3 pl-12 pr-4 text-base focus:outline-none focus:bg-white focus:border-gray-300"
            />
          </div>
          
          {/* Date Pickers and Export */}
          <div className="flex items-center gap-3">
            <button className="bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-full hover:bg-gray-200 transition-colors text-base">
              1-Apr-25 to 15-Apr-25
            </button>
            <button className="bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-full hover:bg-gray-200 transition-colors text-base">
              1-Apr-25 to 15-Apr-25
            </button>
            <button 
              className="bg-teal-500 text-white font-bold py-3 px-8 rounded-full hover:bg-teal-600 transition-colors text-base"
            >
              Export
            </button>
          </div>
        </div>

        {/* History Log List */}
        <div className="space-y-4">
          {historyLogs.map((log, index) => (
            <div 
              key={index} 
              className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="text-gray-600 text-sm font-medium">{log.date}</div>
              <div className="text-gray-900 font-semibold capitalize">{log.action}</div>
              <div className="text-gray-700">{log.details}</div>
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
}

export default History;