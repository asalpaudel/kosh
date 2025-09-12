import React from 'react';
import loanImage from '../../assets/image/loan.png';

function LoanAd() {
  return (
    <div className="bg-black text-white rounded-2xl p-6 flex flex-col justify-between h-full min-h-[450px] shadow-lg">
      
      <div className="text-center">
        <span className="text-9xl font-extrabold block leading-none">7%</span>
      </div>

      <div className="text-center my-6">
        <h3 className="text-4xl font-bold mb-2">ONLY AT</h3>
        <p className="text-lg font-medium tracking-wide">
           Unlock Your Dreams. Affordable Loans Just For You!
        </p>
        {/* <p className="text-lg font-medium tracking-wide">WE FUCK WIT IT</p> */}

      </div>

      <div className="bg-white text-gray-800 p-4 rounded-xl flex items-center justify-between gap-4">
        <div>
          <h4 className="text-xl font-bold mb-1 text-blue-600">Apply For Loan</h4>
          <p className="text-gray-500 text-sm">Easy Loans for your growth</p>
        </div>
        <div className="flex-shrink-0">
          <img src={loanImage} alt="Loan" className="w-20 h-auto"/>
        </div>
      </div>
    </div>
  );
}

export default LoanAd;