import React from 'react';
import { PiggyBankIcon } from '../icons';

const PortfolioItem = ({ label, value, color }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <span className="text-sm font-medium text-gray-300">{label}</span>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
    <div className="w-full bg-gray-700 rounded-full h-1.5">
      <div
        className={`${color} h-1.5 rounded-full`}
        style={{ width: `${(value / 3000) * 100}%` }}
      ></div>
    </div>
  </div>
);

function PortfolioSummary() {
  const portfolioData = [
    { label: "Savings", value: 1300, color: "bg-blue-500" },
    { label: "Loan", value: 2500, color: "bg-teal-400" },
    { label: "Interest", value: 2500, color: "bg-green-500" },
  ];

  return (
    <div className="bg-black text-white p-6 rounded-xl shadow-lg flex flex-col justify-between h-full min-h-[450px]">
      
      <div>
        <h3 className="text-lg font-bold mb-6">Your Portfolio</h3>
        <div className="space-y-5">
          {portfolioData.map((item) => (
            <PortfolioItem key={item.label} {...item} />
          ))}
        </div>
      </div>

      <div className="text-center flex flex-col items-center mt-6">
        <PiggyBankIcon className="w-16 h-16 mb-3 text-green-400" />
        <h3 className="text-lg font-bold mb-1">Need More Interest ?</h3>
        <p className="text-gray-400 text-sm mb-4">
          FD your best blah blah blah blah blah balh ablha fsf.
        </p>
        <button className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-5 rounded-lg transition-colors text-sm">
          Learn More
        </button>
      </div>
    </div>
  );
}

export default PortfolioSummary;