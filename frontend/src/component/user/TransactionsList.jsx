import React from 'react';

function TransactionsList() {
  const transactions = [
    { description: "Loan Interest Deducted", date: "13-Apr-2025", debit: "-Rs. 1,300.00", balance: "Rs. 25,000.00" },
    { description: "Savings Deposited", date: "1-Apr-2025", credit: "Rs. 1,300.00", balance: "Rs. 25,000.00" },
    { description: "Interest Acquired", date: "1-Apr-2025", credit: "Rs. 1,300.00", balance: "Rs. 25,000.00" },
    { description: "Interest Acquired", date: "1-Apr-2025", credit: "Rs. 1,300.00", balance: "Rs. 25,000.00" },
  ];

  return (
    <div className="bg-white rounded-lg p-4 shadow-md col-span-2">
      <h3 className="text-xl font-bold mb-4">Transactions</h3>
      <div className="space-y-4">
        {transactions.map((transaction, index) => (
          <div key={index} className="flex justify-between items-center border-b pb-2 last:border-b-0 last:pb-0">
            <div className="flex flex-col">
              <span className="text-gray-800 font-medium">{transaction.description}</span>
              <span className="text-gray-500 text-sm">{transaction.date}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className={`${transaction.debit ? 'text-red-500' : 'text-green-500'} font-semibold`}>
                {transaction.debit || transaction.credit}
              </span>
              <span className="text-gray-600 text-sm">{transaction.balance}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TransactionsList;