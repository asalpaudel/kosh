import { useEffect, useState } from "react";
import { API_BASE, apiFetch } from "../../lib/apiClient";
import { parseTransactions } from "../../lib/transactions";
import { formatDualDate } from "../../lib/nepaliDate";

const formatAmount = (num: number): string => {
  return `Rs. ${Math.abs(num).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

function TransactionsList() {
  const [transactions, setTransactions] = useState<
    Array<{ id: string; description: string; date: string; isDebit: boolean; amount: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await apiFetch(`${API_BASE}/transactions`);
        const transactions = parseTransactions(await response.json());
        transactions.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

        // Process WITHOUT BALANCE
        const processedTxns = transactions.slice(0, 5).map((transaction) => {
          const isDebit =
            transaction.direction === "Debit" ||
            transaction.type === "Withdrawal" ||
            transaction.type.includes("Debit");
          
          return {
            id: transaction.id,
            description: transaction.type,
            date: transaction.date ? formatDualDate(transaction.date) : "-",
            isDebit,
            amount: formatAmount(transaction.amount),
          };
        });

        setTransactions(processedTxns);
      } catch (error) {
        console.error("Failed to load transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchTransactions();
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
          transactions.map((transaction) => (
            <div key={transaction.id} className="flex justify-between items-center border-b pb-2 last:border-b-0 last:pb-0">
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
