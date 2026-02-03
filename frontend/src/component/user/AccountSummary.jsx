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

        // Fetch user balance
        const userRes = await fetch(`${API_BASE}/users/${userId}`, {
          credentials: "include"
        });

        let userBalance = 0;
        if (userRes.ok) {
          const userData = await userRes.json();
          userBalance = userData.balance || 0;
        }

        // Fetch Fixed Deposit Applications
        const fdRes = await fetch(`${API_BASE}/applications/fixed-deposit/user`, {
          credentials: "include"
        });
        
        let totalFD = 0;
        if (fdRes.ok) {
          const fdApps = await fdRes.json();
          // Sum up all APPROVED fixed deposit applications
          totalFD = fdApps
            .filter(app => app.status === 'APPROVED')
            .reduce((sum, app) => sum + (app.depositAmount || 0), 0);
        }

        // Fetch Saving Account Applications
        const saRes = await fetch(`${API_BASE}/applications/saving-account/user`, {
          credentials: "include"
        });
        
        let totalSavings = 0;
        if (saRes.ok) {
          const saApps = await saRes.json();
          // Sum up all APPROVED savings account applications
          totalSavings = saApps
            .filter(app => app.status === 'APPROVED')
            .reduce((sum, app) => sum + (app.initialDeposit || 0), 0);
        }

        // Fetch Loan Applications
        const loanRes = await fetch(`${API_BASE}/applications/loan/user`, {
          credentials: "include"
        });
        
        let totalLoan = 0;
        if (loanRes.ok) {
          const loanApps = await loanRes.json();
          // Sum up all APPROVED loan applications
          totalLoan = loanApps
            .filter(app => app.status === 'APPROVED')
            .reduce((sum, app) => sum + (app.approvedAmount || app.requestedAmount || 0), 0);
        }

        setSummary({
          balance: userBalance,
          savings: totalSavings,
          fixedDeposit: totalFD,
          loan: totalLoan
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white rounded-lg shadow-md">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-start p-3 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-6 bg-gray-300 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
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