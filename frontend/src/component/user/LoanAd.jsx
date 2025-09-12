import React from 'react';
import loanImage from '../../assets/image/loan.png';

function LoanAd() {
  return (
    <div className="bg-black text-white rounded-2xl p-6 pt-10 pb-24 relative min-h-[750px] shadow-lg">
      
      <div className="text-center">
        <span className="text-8xl font-extrabold block leading-none">7%</span>
        <p className="text-2xl font-semibold mt-2">Interest Rate</p>
      </div>

      <div className="text-center my-8">
        <p className="text-lg font-medium leading-relaxed">
          Unlock Your Dreams.
          <br /> Affordable Loans Made Easy.
        </p>
      </div>

      <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 w-[90%] bg-white rounded-2xl shadow-lg p-5 flex items-center justify-between">
        
        <div>
          <h2 className="text-4xl font-bold text-gray-800 leading-tight">
            <span className="text-teal-500">Apply</span> For
            <br />
            Loan
          </h2>
          <p className="text-gray-500 mt-2 text-base">
            Easy Loans for you growth
          </p>
        </div>

        <div className="flex-shrink-0">
          <img 
            src={loanImage} 
            alt="Illustration of a hand holding a money bag for a loan application" 
            className="w-40 h-auto"
          />
        </div>
      </div>
    </div>
  );
}

export default LoanAd;