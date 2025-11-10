import React from 'react';
import NetworkDonutChart from '../../component/superadmin/NetworkDonutChart';

const TotalPoolItem = ({ label, value }) => (
  <div className="flex justify-between items-center py-2">
    <span className="text-gray-600 font-medium">{label}</span>
    <span className="text-gray-900 font-bold">{value}</span>
  </div>
);

const RecentTransactionItem = ({ name, date, amount, balance }) => (
  <div className="grid grid-cols-3 items-center py-3 border-b last:border-b-0">
    <div>
      <p className="font-bold text-gray-900">{name}</p>
      <p className="text-sm text-gray-500">{date}</p>
    </div>
    <span className="text-green-500 font-medium text-right">{amount}</span>
    <span className="text-gray-900 font-medium text-right">{balance}</span>
  </div>
);

function AdminDashboard() {
  
  const recentTransactions = [
    { name: "Asal's acc credited", date: '13-Apr-2025', amount: 'Rs. 1,300.00', balance: 'Rs. 25,000.00' },
    { name: 'Barshat Deposited', date: '1-Apr-2025', amount: 'Rs. 1,300.00', balance: 'Rs. 25,000.00' },
    { name: 'Sidd Deposited', date: '1-Apr-2025', amount: 'Rs. 1,300.00', balance: 'Rs. 25,000.00' },
    { name: 'Asal Deposited', date: '1-Apr-2025', amount: 'Rs. 1,300.00', balance: 'Rs. 25,000.00' },
  ];

  return (
    <div className="bg-white p-6">

      {/* --- TOP SECTION (MODIFIED) --- */}
      {/* This grid has 3 columns total. The first card spans 2, the second spans 1. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Card 1: Chart + Pool (Spans 2 columns) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-lg">
          {/* Internal grid to place chart and list side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            {/* Internal Left: Chart */}
            <div className="min-h-[300px]">
              <NetworkDonutChart />
            </div>
            
            {/* Internal Right: List */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Total Pool</h3>
              <div className="space-y-2">
                <TotalPoolItem label="Total Pool" value="Rs. 1,30,000.00" />
                <TotalPoolItem label="Total Savings" value="Rs. 1,30,000.00" />
                <TotalPoolItem label="Total Credit" value="Rs. 1,30,000.00" />
                <TotalPoolItem label="Credit Reserve" value="Rs. 1,30,000.00" />
              </div>
            </div>

          </div>
        </div>
        
        {/* Card 2: Active Users (Spans 1 column) */}
        <div className="lg:col-span-1 bg-white p-8 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Active Users</h3>
          <div className="bg-gray-100 h-full min-h-[150px] rounded-lg flex items-center justify-center">
            <p className="text-gray-500 italic">Active users chart or list goes here</p>
          </div>
        </div>
      </div>
      {/* --- END OF MODIFIED SECTION --- */}


      {/* Bottom Section: Recent Transactions + Shortcuts (Unchanged) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Overall Transactions */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Overall Transactions</h3>
          {/* Header */}
          <div className="grid grid-cols-3 items-center pb-3 border-b text-sm font-semibold text-gray-500">
            <span>Name</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Balance</span>
          </div>
          {/* List */}
          <div>
            {recentTransactions.map((tx, index) => (
              <RecentTransactionItem key={index} {...tx} />
            ))}
          </div>
        </div>

        {/* Shortcuts */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Shortcuts</h3>
          <div className="space-y-3">
            <button className="w-full text-left font-medium text-blue-600 hover:underline">
              Add Cash
            </button>
            <button className="w-full text-left font-medium text-blue-600 hover:underline">
              Add New User
            </button>
            <button className="w-full text-left font-medium text-blue-600 hover:underline">
              Manage Users
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;