import { useEffect, useState } from "react";
import { API_BASE, apiFetch } from "../../lib/apiClient";
import { parseMemberTransparency } from "../../lib/memberTransparency";
import { formatDualDate } from "../../lib/nepaliDate";

const formatAmount = (num: number): string => {
  return `Rs. ${Math.abs(num).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

function TransactionsList() {
  const [transactions, setTransactions] = useState<
    Array<{ id: string; sequence: number; description: string; date: string; isDebit: boolean; amount: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await apiFetch(`${API_BASE}/member-transparency/me`);
        const ledger = parseMemberTransparency(await response.json());
        const processedTxns = ledger.history.slice(0, 5).map((transaction) => {
          const isDebit = transaction.change < 0;
          return {
            id: transaction.lineId,
            sequence: transaction.sequenceNo,
            description: transaction.narration || transaction.accountName,
            date: transaction.date ? formatDualDate(transaction.date) : "-",
            isDebit,
            amount: formatAmount(transaction.change),
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
                <span className="text-gray-500 text-sm">Journal #{transaction.sequence} · {transaction.date}</span>
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
