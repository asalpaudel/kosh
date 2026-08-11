import { useEffect, useState } from "react";
import { API_BASE, apiFetch } from "../../lib/apiClient";
import { parseMemberTransparency } from "../../lib/memberTransparency";


const formatAmount = (num: number): string => {
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

function AccountSummary() {
  const [summary, setSummary] = useState({
    savings: 0,
    fixedDeposit: 0,
    loan: 0,
    shares: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccountSummary = async () => {
      try {
        const response = await apiFetch(`${API_BASE}/member-transparency/me`);
        const ledger = parseMemberTransparency(await response.json());
        setSummary({
          savings: ledger.savingsBalance,
          fixedDeposit: ledger.fixedDepositBalance,
          loan: ledger.loanBalance,
          shares: ledger.shareCapitalBalance,
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
    { name: "Ledger savings balance", amount: summary.savings },
    { name: "Fixed Deposit", amount: summary.fixedDeposit },
    { name: "Loan outstanding", amount: summary.loan },
    { name: "Share capital", amount: summary.shares }
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
