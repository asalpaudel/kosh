/* src/component/user/TransactionsList.jsx */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = "http://localhost:8080/api";

function TransactionsList() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      try {
        const response = await fetch(`${API_BASE}/transactions`, {
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Filter for current user, Sort by Date Descending (Newest first)
          const userTxns = data
            .filter(t => String(t.userId) === String(userId))
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5); // Take only latest 5

          setTransactions(userTxns);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Helper to format amount
  const formatAmount = (val) => {
    const num = parseFloat(val) || 0;
    return "Rs. " + num.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  };

  // Helper to check if credit or debit
  const isCredit = (txn) => {
    // Logic depends on your backend 'type' or 'details.direction'
    // Assuming standard naming or the 'Credit'/'Debit' direction in details
    if (txn.details?.direction === 'Debit') return false;
    if (txn.details?.direction === 'Credit') return true;
    
    // Fallback based on type string
    const type = txn.type?.toLowerCase() || "";
    return !type.includes("withdraw") && !type.includes("debit");
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-md col-span-2 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">Recent Transactions</h3>
        <Link 
          to="/home/statement" 
          className="text-sm font-semibold text-teal-600 hover:text-teal-800 hover:underline"
        >
          View All
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading transactions...</p>
      ) : transactions.length === 0 ? (
        <p className="text-gray-400 text-sm italic">No recent transactions found.</p>
      ) : (
        <div className="space-y-4 flex-1">
          {transactions.map((transaction) => {
            const credit = isCredit(transaction);
            const amount = transaction.amount || transaction.amountValue;

            return (
              <div key={transaction.id} className="flex justify-between items-center border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                <div className="flex flex-col">
                  <span className="text-gray-800 font-medium text-sm sm:text-base">
                    {transaction.type}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {new Date(transaction.date).toLocaleDateString()} 
                    {transaction.voucherId && ` • ${transaction.voucherId}`}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`font-bold text-sm sm:text-base ${credit ? 'text-green-600' : 'text-red-600'}`}>
                    {credit ? "+" : "-"} {formatAmount(amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="mt-6 pt-4 border-t border-gray-100 text-center">
        <Link 
          to="/home/statement"
          className="inline-block px-6 py-2 bg-gray-100 text-gray-700 font-semibold text-sm rounded-full hover:bg-gray-200 transition-colors"
        >
          View Full Statement
        </Link>
      </div>
    </div>
  );
}

export default TransactionsList;