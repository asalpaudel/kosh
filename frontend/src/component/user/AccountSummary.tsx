import { useEffect, useState } from "react";
import { API_BASE, apiFetch } from "../../lib/apiClient";
import { parseTransactions } from "../../lib/transactions";
import { isRecord } from "../../lib/validation";


const formatAmount = (num: number): string => {
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
        // 1. Fetch User Info (for Main Wallet Balance)
        const userRes = await apiFetch(`${API_BASE}/users/me`);
        let userBalance = 0;
        const userData: unknown = await userRes.json();
        if (isRecord(userData) && typeof userData.balance === "number") userBalance = userData.balance;

        // 2. Fetch All Transactions for User
        // Note: You might need to ensure your backend supports filtering by userId for this endpoint
        const txRes = await apiFetch(`${API_BASE}/transactions`);
        
        let totalSavings = 0;
        let totalFD = 0;
        let totalLoan = 0;

        const transactions = parseTransactions(await txRes.json());
        for (const transaction of transactions) {
            const { amount, accountHead: head, direction, type } = transaction;

            // ⭐ LOGIC: Calculate based on Head and Direction
            
            // SAVINGS: Credit = Deposit (+), Debit = Withdraw (-)
            if (head && head.includes("Savings")) {
              if (direction === "Credit" || type.includes("Deposit") || type.includes("Opening")) {
                totalSavings += amount;
              } else if (direction === "Debit" || type.includes("Withdraw")) {
                totalSavings -= amount;
              }
            }

            // FIXED DEPOSIT: Credit = Deposit (+), Debit = Withdraw (-)
            if (head && head.includes("Fixed Deposit")) {
              if (direction === "Credit" || type.includes("Creation")) {
                totalFD += amount;
              } else if (direction === "Debit") {
                totalFD -= amount;
              }
            }

            // LOAN: Debit = Disbursement (Debt Increases +), Credit = Repayment (Debt Decreases -)
            if (head && head.includes("Loan")) {
              if (direction === "Debit" || type.includes("Disbursement")) {
                totalLoan += amount; // You owe this money
              } else if (direction === "Credit" || type.includes("Repayment")) {
                totalLoan -= amount; // You paid this back
              }
            }
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

    void fetchAccountSummary();
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
      {accounts.map((account) => (
        <div key={account.name} className="flex flex-col items-start p-3">
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
