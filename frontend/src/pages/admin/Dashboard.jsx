import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NetworkDonutChart from '../../component/superadmin/NetworkDonutChart';

const apiBase = "http://localhost:8080/api";

const TotalPoolItem = ({ label, value }) => (
  <div className="flex justify-between items-center py-2">
    <span className="text-gray-600 font-medium">{label}</span>
    <span className="text-gray-900 font-bold">{value}</span>
  </div>
);

const RecentTransactionItem = ({ user, date, type, amount }) => (
  <div className="grid grid-cols-3 items-center py-3 border-b last:border-b-0">
    <div>
      <p className="font-bold text-gray-900">{user}</p>
      <p className="text-sm text-gray-500">{date}</p>
    </div>
    <span className="text-gray-700 capitalize">{type}</span>
    <span className="text-gray-900 font-medium text-right">{amount}</span>
  </div>
);

function AdminDashboard() {
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/transactions`);
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }
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
    <div className="bg-white p-6">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            <div className="min-h-[300px]">
              <NetworkDonutChart />
            </div>
            
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
        
        <div className="lg:col-span-1 bg-white p-8 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Active Users</h3>
          <div className="bg-gray-100 h-full min-h-[150px] rounded-lg flex items-center justify-center">
            <p className="text-gray-500 italic">Active users chart or list goes here</p>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Overall Transactions</h3>
          
          <div className="grid grid-cols-3 items-center pb-3 border-b text-sm font-semibold text-gray-500">
            <span>Name</span>
            <span>Type</span>
            <span className="text-right">Amount</span>
          </div>
          
          <div>
            {loading ? (
              <div className="text-center py-6 text-gray-500">Loading...</div>
            ) : transactions.length > 0 ? (
              transactions.slice().reverse().slice(0, 5).map((tx) => (
                <RecentTransactionItem 
                  key={tx.id} 
                  user={tx.user} 
                  date={tx.date}
                  type={tx.type}
                  amount={tx.amount}
                />
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">No transactions found.</div>
            )}
          </div>

          <div className="mt-6 text-center">
            <Link 
              to="/admin/transactions" 
              className="bg-teal-500 text-white font-bold py-2.5 px-6 rounded-full hover:bg-teal-600 transition-colors text-base"
            >
              View All Transactions
            </Link>
          </div>

        </div>

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