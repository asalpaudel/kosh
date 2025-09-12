import React from 'react';

function LoanAd() {
  const PlaceholderImage = () => (
    <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-xs text-gray-500">
      Image
    </div>
  );

  return (
    <div className="bg-black text-white rounded-lg p-6 flex flex-col justify-between h-full min-h-[400px]">
      <div className="text-right">
        <span className="text-8xl font-extrabold block leading-none">7/</span>
        <span className="text-7xl font-extrabold block leading-none">%</span>
      </div>

      <div className="text-center my-6">
        <h3 className="text-3xl font-bold mb-2">ONLY AT</h3>
        <p className="text-lg font-medium tracking-wide">WE FUCK WIT IT</p>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg flex items-center justify-between gap-4">
        <div>
          <h4 className="text-lg font-bold mb-1">Apply For Loan</h4>
          <p className="text-gray-400 text-sm">Easy Loans for your growth</p>
        </div>
        <div className="flex-shrink-0">
          <PlaceholderImage />
        </div>
      </div>
    </div>
  );
}

export default LoanAd;