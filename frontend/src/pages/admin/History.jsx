import React from 'react';
import { SearchIcon } from '../../component/icons.jsx'; 

function AdminHistory() {
  
  const transactionLogs = [
    {
      date: '13-Apr-2025',
      user: 'Ram Member (ID: 3)',
      type: 'Deposit',
      amount: 'Rs. 5,000.00'
    },
    {
      date: '13-Apr-2025',
      user: 'Asal Admin (ID: 1)',
      type: 'Loan Payment',
      amount: 'Rs. 1,200.00'
    },
    {
      date: '12-Apr-2025',
      user: 'Shyam Staff (ID: 6)',
      type: 'Withdrawal',
      amount: 'Rs. 10,000.00'
    },
    {
      date: '12-Apr-2025',
      user: 'Ram Member (ID: 3)',
      type: 'Interest Added',
      amount: 'Rs. 150.00'
    },
  ];

  return (
    <div className="bg-white p-6"> 
      
      <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
        
        <div className="relative flex-grow sm:flex-grow-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search by user, type, amount..."
            className="w-full sm:w-80 bg-gray-100 text-gray-700 border border-transparent rounded-full py-3 pl-11 pr-4 text-base focus:outline-none focus:bg-white focus:border-gray-300"
          />
        </div>
        
        <div className="flex items-center gap-3">
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

      <div className="w-full overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-4 px-2 text-sm font-semibold text-gray-600">Date</th>
              <th className="py-4 px-2 text-sm font-semibold text-gray-600">User</th>
              <th className="py-4 px-2 text-sm font-semibold text-gray-600">Transaction Type</th>
              <th className="py-4 px-2 text-sm font-semibold text-gray-600 text-right">Amount</th>
            </tr>
          </thead>
          
          <tbody>
            {transactionLogs.map((log, index) => (
              <tr key={index} className="border-b border-gray-200 last:border-b-0">
                <td className="py-4 px-2 text-gray-600 text-sm font-medium">{log.date}</td>
                <td className="py-4 px-2 text-gray-900 font-semibold">{log.user}</td>
                <td className="py-4 px-2 text-gray-700">{log.type}</td>
                <td className="py-4 px-2 text-gray-900 font-bold text-right">{log.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}

export default AdminHistory;