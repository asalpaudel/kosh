import React, { useState, useEffect } from 'react';

const API_BASE = "http://localhost:8080/api";

const parseAmount = (val) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  return parseFloat(String(val).replace(/[^\d.-]/g, ''));
};

const formatAmount = (num) => {
  return `Rs. ${Math.abs(num).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

function TransactionsList() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/transactions`, { 
          credentials: "include" 
        });
        
        if (!res.ok) {
          console.error("Failed to fetch transactions");
          setLoading(false);
          return;
        }
        
        const data = await res.json();

        // Filter & sort user transactions
        const myTxns = data
          .filter(t => String(t.userId) === String(userId))
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        // Process WITHOUT BALANCE
        const processedTxns = myTxns.slice(0, 5).map(t => {
          const amount = parseAmount(t.amount || t.amountValue);
          const isDebit = t.type === 'Withdrawal' || (t.type && t.type.includes('Debit'));
          
          return {
            id: t.id || t.transactionId,
            description: t.type || 'Transaction',
            date: t.date
              ? new Date(t.date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                }).replace(/ /g, '-')
              : '-',
            isDebit,
            amount: formatAmount(amount)
          };
        });

        setTransactions(processedTxns);
      } catch (error) {
        console.error("Failed to load transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-md col-span-2">
        <h3 className="text-xl font-bold mb-4">Transactions</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-md col-span-2">
      <h3 className="text-xl font-bold mb-4">Transactions</h3>
      <div className="space-y-4">
        {transactions.length > 0 ? (
          transactions.map((transaction, index) => (
            <div key={index} className="flex justify-between items-center border-b pb-2 last:border-b-0 last:pb-0">
              <div className="flex flex-col">
                <span className="text-gray-800 font-medium">{transaction.description}</span>
                <span className="text-gray-500 text-sm">{transaction.date}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className={`${transaction.isDebit ? 'text-red-500' : 'text-green-500'} font-semibold`}>
                  {transaction.isDebit ? '-' : '+'}{transaction.amount}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TransactionsList;
