import { useEffect, useState } from "react";
import { API_BASE, apiFetch } from "../../lib/apiClient";
import { parseTransactions } from "../../lib/transactions";
import { PiggyBankIcon } from "../icons";


interface PortfolioItemData {
  label: string;
  value: number;
  color: string;
}

interface PortfolioItemProps extends PortfolioItemData {
  total: number;
}

const PortfolioItem = ({ label, value, color, total }: PortfolioItemProps) => {
  // Calculate percentage based on total value (assets + liabilities magnitude)
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <span className="text-sm font-bold text-white">Rs. {value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-1.5">
        <div
          className={`${color} h-1.5 rounded-full`}
          style={{ width: `${String(Math.min(percentage, 100))}%` }}
        ></div>
      </div>
    </div>
  );
};

function PortfolioSummary() {
  const [portfolioData, setPortfolioData] = useState<PortfolioItemData[]>([
    { label: "Savings", value: 0, color: "bg-blue-500" },
    { label: "Fixed Deposit", value: 0, color: "bg-teal-400" },
    { label: "Loan", value: 0, color: "bg-red-500" },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        const response = await apiFetch(`${API_BASE}/transactions`);
        const transactions = parseTransactions(await response.json());

        let totalSavings = 0;
        let totalFD = 0;
        let totalLoan = 0;

        for (const transaction of transactions) {
          const { amount, accountHead: head, direction, type } = transaction;

          // 1. SAVINGS LOGIC
          if (head.includes("Savings") || type.includes("Savings")) {
            const isCredit = direction === "Credit" || type.includes("Deposit") || type.includes("Opening");
            const isDebit = direction === "Debit" || type.includes("Withdraw");

            if (isCredit) totalSavings += amount;
            else if (isDebit) totalSavings -= amount;
          }

          // 2. FIXED DEPOSIT LOGIC
          if (head.includes("Fixed Deposit") || type.includes("Fixed Deposit")) {
            const isCredit = direction === "Credit" || type.includes("Creation") || type.includes("Deposit");
            const isDebit = direction === "Debit" || type.includes("Withdraw");

            if (isCredit) totalFD += amount;
            else if (isDebit) totalFD -= amount;
          }

          // 3. LOAN LOGIC (Outstanding Debt)
          // Debit = Disbursement (Debt Increases +)
          // Credit = Repayment (Debt Decreases -)
          if (head.includes("Loan") || type.includes("Loan")) {
            const isDebit = direction === "Debit" || type.includes("Disbursement");
            const isCredit = direction === "Credit" || type.includes("Repayment");

            if (isDebit) totalLoan += amount;
            else if (isCredit) totalLoan -= amount;
          }
        }

        // Update portfolio data
        setPortfolioData([
          { label: "Savings", value: Math.max(0, totalSavings), color: "bg-blue-500" },
          { label: "Fixed Deposit", value: Math.max(0, totalFD), color: "bg-teal-400" },
          { label: "Loan", value: Math.max(0, totalLoan), color: "bg-red-500" },
        ]);

      } catch (error) {
        console.error("Failed to load portfolio data:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchPortfolioData();
  }, []);

  // Calculate total magnitude for bar visualization
  const totalValue = portfolioData.reduce((sum, item) => sum + item.value, 0);

  if (loading) {
    return (
      <div className="bg-black text-white p-6 rounded-xl shadow-lg flex flex-col justify-between h-full min-h-[450px]">
        <div>
          <h3 className="text-lg font-bold mb-6">Your Portfolio</h3>
          <p className="text-gray-400 text-sm">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white p-6 rounded-xl shadow-lg flex flex-col justify-between h-full min-h-[450px]">
      
      <div>
        <h3 className="text-lg font-bold mb-6">Your Portfolio</h3>
        <div className="space-y-5">
          {portfolioData.map((item) => (
            <PortfolioItem key={item.label} {...item} total={totalValue} />
          ))}
        </div>
      </div>

      <div className="text-center flex flex-col items-center mt-6">
        <PiggyBankIcon className="w-16 h-16 mb-3 text-green-400" />
        <h3 className="text-lg font-bold mb-1">Need More Interest ?</h3>
        <p className="text-gray-400 text-sm mb-4">
          Fixed Deposits offer higher interest rates than regular savings accounts.
        </p>
        <button 
          onClick={() => window.location.hash = '#/home/packages'}
          className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-5 rounded-lg transition-colors text-sm"
        >
          Explore FD
        </button>
      </div>
    </div>
  );
}

export default PortfolioSummary;
