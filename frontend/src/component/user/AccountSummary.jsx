import React from 'react';

function AccountSummary() {
  const accounts = [
    { name: "Savings", amount: "1,30,000.00" },
    { name: "Loan", amount: "1,30,000.00" },
    { name: "Interest", amount: "1,30,000.00" },
    { name: "Savings", amount: "1,30,000.00" }, 
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white rounded-lg shadow-md">
      {accounts.map((account, index) => (
        <div key={index} className="flex flex-col items-start p-3">
          <span className="text-gray-600 text-sm font-medium">{account.name}</span>
          <span className="text-gray-900 text-xl font-bold">Rs. {account.amount}</span>
        </div>
      ))}
    </div>
  );
}

export default AccountSummary;