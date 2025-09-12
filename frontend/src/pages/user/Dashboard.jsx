// src/pages/Dashboard.jsx (or wherever you prefer to put your page components)
import React from 'react';
import AccountSummary from '../../component/user/AccountSummary';
import FinancialChart from '../../component/user/FinancialChart';
import TransactionsList from '../../component/user/TransactionsList';
import LoanAd from '../../component/user/LoanAd';
  


function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
          <div className="container mx-auto py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* Top Row - Account Summary (full width) */}
              <div className="col-span-full">
                <AccountSummary />
              </div>

              {/* Main Content Area - Chart and Transactions */}
              <div className="md:col-span-2 lg:col-span-3 flex flex-col gap-6">
                <FinancialChart />
                <TransactionsList />
              </div>

              {/* Right Sidebar Ad */}
              <div className="md:col-span-1 lg:col-span-1">
                <LoanAd />
              </div>
            </div>
          </div>
        {/* </div>
      </div> */}
    </div>
  );
}

export default Dashboard;