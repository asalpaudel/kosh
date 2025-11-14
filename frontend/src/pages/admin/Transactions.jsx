import React, { useState, useEffect, useMemo } from 'react';
import {
  SearchIcon,
  PlusCircleIcon,
} from "../../component/icons.jsx";
import Modal from "../../component/superadmin/Modal.jsx";
import AddTransactionForm from "../../component/admin/AddTransactionForm.jsx";

const API_BASE = "http://localhost:8080/api";

function AdminTransactions() {
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/transactions`); 
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

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return transactions;

    return transactions.filter(log => 
      log.user?.toLowerCase().includes(query) ||
      log.type?.toLowerCase().includes(query) ||
      log.amount?.toLowerCase().includes(query) ||
      log.transactionId?.toLowerCase().includes(query) 
    );
  }, [transactions, searchQuery]);

  const handleTransactionAdded = () => {
    setIsAddModalOpen(false);
    loadTransactions(); 
  };

  return (
    <div className="bg-white p-6"> 
      
      <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
        
        <div className="relative flex-grow sm:flex-grow-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search by ID, user, type..." 
            className="w-full sm:w-80 bg-gray-100 text-gray-700 border border-transparent rounded-full py-3 pl-11 pr-4 text-base focus:outline-none focus:bg-white focus:border-gray-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
              <th className="py-4 px-2 text-sm font-semibold text-gray-600">Transaction ID</th>
              <th className="py-4 px-2 text-sm font-semibold text-gray-600">User (Account Holder)</th>
              <th className="py-4 px-2 text-sm font-semibold text-gray-600">Transaction Type</th>
              <th className="py-4 px-2 text-sm font-semibold text-gray-600 text-right">Amount</th>
            </tr>
          </thead>
          
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="py-8 text-center text-gray-500">
                  Loading transactions...
                </td>
              </tr>
            ) : filteredTransactions.length > 0 ? (
              filteredTransactions.map((log) => ( 
                <tr key={log.id} className="border-b border-gray-200 last:border-b-0">
                  
                  <td className="py-4 px-2 text-gray-600 text-sm font-mono">
                    {log.transactionId || 'N/A'}
                  </td>
                  
                  <td className="py-4 px-2 text-gray-900 font-semibold">{log.user}</td>
                  <td className="py-4 px-2 text-gray-700">{log.type}</td>
                  <td className="py-4 px-2 text-gray-900 font-bold text-right">{log.amount}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="py-8 text-center text-gray-500">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="group fixed z-20 bottom-10 right-10 flex flex-col items-center gap-3">
        <button
          title="Add Transaction"
          onClick={() => setIsAddModalOpen(true)}
          className="fab-button bg-teal-500 rounded-full p-4 text-white shadow-lg hover:bg-teal-600 transition-all"
        >
          <PlusCircleIcon className="w-10 h-10 fab-icon" />
        </button>
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Transaction"
        size="2xl"
      >
        <AddTransactionForm
          onAdded={handleTransactionAdded}
          onClose={() => setIsAddModalOpen(false)}
        />
      </Modal>

    </div>
  );
}

export default AdminTransactions;