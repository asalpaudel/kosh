import React, { useState, useEffect } from 'react';

const API_BASE = "http://localhost:8080/api";

function AccountSummary() {
  const [summary, setSummary] = useState({
    savings: 0,
    fixedDeposit: 0,
    loan: 0,
    totalInterest: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      try {
        setLoading(true);

        // 1. Fetch User Details for Savings Balance (Source of Truth)
        const userRes = await fetch(`${API_BASE}/users/me`, {
          credentials: "include",
        });
        
        let savingsBalance = 0;
        if (userRes.ok) {
          const userData = await userRes.json();
          // Backend User entity has a 'balance' field
          savingsBalance = userData.balance || 0;
        }

        // 2. Fetch Transactions for Portfolio Calculation (Loans, FD, Interest)
        // Using the user-specific endpoint to avoid fetching all network transactions
        const txRes = await fetch(`${API_BASE}/transactions/user/${userId}`, {
          credentials: "include",
        });

        let loan = 0;
        let fd = 0;
        let interest = 0;

        if (txRes.ok) {
          const transactions = await txRes.json();

          transactions.forEach(t => {
            const amount = t.amountValue || 0; // Signed value (+ for Credit, - for Debit)
            const type = t.type || "";

            // --- Loan Logic (Liability) ---
            // Credit (Money in) = Loan Taken (+)
            // Debit (Money out) = Repayment (-)
            if (type === "Loan") {
              loan += amount;
            }

            // --- Fixed Deposit Logic (Asset) ---
            // Debit (Money out of wallet) = Investment into FD (+)
            // Credit (Money into wallet) = Maturity return (-)
            else if (type === "Fixed Deposit") {
              fd -= amount; 
            }

            // --- Interest Logic (Income) ---
            // Credit (Money in) = Interest Earned
            else if (type === "Interest" && amount > 0) {
              interest += amount;
            }
          });
        }

        setSummary({
          savings: savingsBalance,
          fixedDeposit: Math.max(0, fd), // Avoid negative dust
          loan: Math.max(0, loan),       // Avoid negative dust
          totalInterest: interest
        });

      } catch (error) {
        console.error("Error loading account summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const accounts = [
    { 
      name: "Savings Balance", 
      amount: summary.savings, 
      color: "text-gray-900" 
    },
    { 
      name: "Active Loans", 
      amount: summary.loan, 
      color: summary.loan > 0 ? "text-orange-600" : "text-gray-900" 
    },
    { 
      name: "Fixed Deposits", 
      amount: summary.fixedDeposit, 
      color: "text-teal-600" 
    },
    { 
      name: "Total Interest Earned", 
      amount: summary.totalInterest, 
      color: "text-green-600" 
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white rounded-lg shadow-md">
      {accounts.map((account, index) => (
        <div key={index} className="flex flex-col items-start p-3 border-r last:border-r-0 border-gray-100">
          <span className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">
            {account.name}
          </span>
          {loading ? (
            <div className="h-7 w-32 bg-gray-100 rounded animate-pulse"></div>
          ) : (
            <span className={`text-xl font-bold ${account.color}`}>
              Rs. {account.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default AccountSummary;