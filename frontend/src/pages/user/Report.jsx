import React from 'react';
import FinancialChart from '../../component/user/FinancialChart';
import PortfolioSummary from '../../component/user/PortfolioSummary';

function Report() {
  return (
    // The min-h-screen class has been removed from this container
    <div className="bg-white p-4"> 
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Graph Muji</h2>
              <FinancialChart />
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-2xl font-bold mb-4">Summary</h2>
              <p className="text-gray-600">
                Based on your financial activity over the last year, your savings have shown a consistent upward trend, increasing by 15% overall. There was a notable peak in the third quarter, followed by a slight dip, which has now stabilized. Your loan payments are on schedule, and interest accruals are within the expected range. We recommend continuing your current savings plan and exploring investment options to further grow your portfolio.
              </p>
            </div>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-6">
            <PortfolioSummary /> 
          </div>

        </div>
      </div>
    </div>
  );
}

export default Report;