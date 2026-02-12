import React, { useState, useEffect } from 'react';

const API_BASE = "http://localhost:8080/api";

const formatAmount = (num) => {
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

function AccountSummary() {
  const [summary, setSummary] = useState({
    balance: 0,
    savings: 0,
    fixedDeposit: 0,
    loan: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccountSummary = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          setLoading(false);
          return;
        }

        // 1. Fetch User Info (for Main Wallet Balance)
        const userRes = await fetch(`${API_BASE}/users/${userId}`, { credentials: "include" });
        let userBalance = 0;
        if (userRes.ok) {
          const userData = await userRes.json();
          userBalance = userData.balance || 0;
        }

        // 2. Fetch All Transactions for User
        // Note: You might need to ensure your backend supports filtering by userId for this endpoint
        const txRes = await fetch(`${API_BASE}/transactions`, { credentials: "include" });
        
        let totalSavings = 0;
        let totalFD = 0;
        let totalLoan = 0;

        if (txRes.ok) {
          const transactions = await txRes.json();
          
          transactions.forEach(tx => {
            // Ensure we handle both string/number formats if API varies
            const amount = parseFloat(tx.amount || tx.amountValue || 0);
            const head = tx.details?.internalHead || tx.accountHead || tx.type; // Adjust based on exact API response
            const direction = tx.details?.direction || ""; 

            // ⭐ LOGIC: Calculate based on Head and Direction
            
            // SAVINGS: Credit = Deposit (+), Debit = Withdraw (-)
            if (head && head.includes("Savings")) {
              if (direction === "Credit" || tx.type.includes("Deposit") || tx.type.includes("Opening")) {
                totalSavings += amount;
              } else if (direction === "Debit" || tx.type.includes("Withdraw")) {
                totalSavings -= amount;
              }
            }

            // FIXED DEPOSIT: Credit = Deposit (+), Debit = Withdraw (-)
            if (head && head.includes("Fixed Deposit")) {
              if (direction === "Credit" || tx.type.includes("Creation")) {
                totalFD += amount;
              } else if (direction === "Debit") {
                totalFD -= amount;
              }
            }

            // LOAN: Debit = Disbursement (Debt Increases +), Credit = Repayment (Debt Decreases -)
            if (head && head.includes("Loan")) {
              if (direction === "Debit" || tx.type.includes("Disbursement")) {
                totalLoan += amount; // You owe this money
              } else if (direction === "Credit" || tx.type.includes("Repayment")) {
                totalLoan -= amount; // You paid this back
              }
            }
          });
        }

        setSummary({
          balance: userBalance,
          savings: totalSavings,
          fixedDeposit: totalFD,
          loan: totalLoan // If negative, it means they overpaid (unlikely), if positive it's outstanding debt
        });

      } catch (error) {
        console.error("Failed to load account summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountSummary();
  }, []);

  const accounts = [
    { name: "Balance", amount: summary.balance },
    { name: "Savings", amount: summary.savings },
    { name: "Fixed Deposit", amount: summary.fixedDeposit },
    { name: "Loan", amount: summary.loan }
  ];

  // ... (Rest of the loading/render UI remains the same)
  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white rounded-lg shadow-md">
      {accounts.map((account, index) => (
        <div key={index} className="flex flex-col items-start p-3">
          <span className="text-gray-600 text-sm font-medium">{account.name}</span>
          <span className="text-gray-900 text-xl font-bold">
            Rs. {formatAmount(account.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default AccountSummary;