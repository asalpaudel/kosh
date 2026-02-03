import React, { useState, useEffect } from 'react';
import { PiggyBankIcon } from '../icons';

const API_BASE = "http://localhost:8080/api";

const PortfolioItem = ({ label, value, color, total }) => {
  // Calculate percentage based on total value to avoid hardcoded values
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <span className="text-sm font-bold text-white">Rs. {value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-1.5">
        <div
          className={`${color} h-1.5 rounded-full`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

function PortfolioSummary() {
  const [portfolioData, setPortfolioData] = useState([
    { label: "Savings", value: 0, color: "bg-blue-500" },
    { label: "Fixed Deposit", value: 0, color: "bg-teal-400" },
    { label: "Loan", value: 0, color: "bg-red-500" },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          setLoading(false);
          return;
        }

        // Fetch user balance
        const userRes = await fetch(`${API_BASE}/users/${userId}`, {
          credentials: "include"
        });

        let userBalance = 0;
        if (userRes.ok) {
          const userData = await userRes.json();
          userBalance = userData.balance || 0;
        }

        // Fetch Fixed Deposit Applications
        const fdRes = await fetch(`${API_BASE}/applications/fixed-deposit/user`, {
          credentials: "include"
        });
        
        let totalFD = 0;
        if (fdRes.ok) {
          const fdApps = await fdRes.json();
          // Sum up all APPROVED fixed deposit applications
          totalFD = fdApps
            .filter(app => app.status === 'APPROVED')
            .reduce((sum, app) => sum + (app.depositAmount || 0), 0);
        }

        // Fetch Saving Account Applications
        const saRes = await fetch(`${API_BASE}/applications/saving-account/user`, {
          credentials: "include"
        });
        
        let totalSavings = 0;
        if (saRes.ok) {
          const saApps = await saRes.json();
          // Sum up all APPROVED savings account applications
          totalSavings = saApps
            .filter(app => app.status === 'APPROVED')
            .reduce((sum, app) => sum + (app.initialDeposit || 0), 0);
        }

        // Fetch Loan Applications
        const loanRes = await fetch(`${API_BASE}/applications/loan/user`, {
          credentials: "include"
        });
        
        let totalLoan = 0;
        if (loanRes.ok) {
          const loanApps = await loanRes.json();
          // Sum up all APPROVED loan applications using approvedAmount
          totalLoan = loanApps
            .filter(app => app.status === 'APPROVED')
            .reduce((sum, app) => sum + (app.approvedAmount || app.requestedAmount || 0), 0);
        }

        // Update portfolio data
        setPortfolioData([
          { label: "Savings", value: totalSavings, color: "bg-blue-500" },
          { label: "Fixed Deposit", value: totalFD, color: "bg-teal-400" },
          { label: "Loan", value: totalLoan, color: "bg-red-500" },
        ]);

      } catch (error) {
        console.error("Failed to load portfolio data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();
  }, []);

  // Calculate total for percentage calculation
  const totalValue = portfolioData.reduce((sum, item) => sum + item.value, 0);

  if (loading) {
    return (
      <div className="bg-black text-white p-6 rounded-xl shadow-lg flex flex-col justify-between h-full min-h-[450px]">
        <div>
          <h3 className="text-lg font-bold mb-6">Your Portfolio</h3>
          <div className="space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-300">Loading...</span>
                  <span className="text-sm font-bold text-white">Rs. 0.00</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div className="bg-gray-500 h-1.5 rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>
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

  return (
    <div className="bg-black text-white p-6 rounded-xl shadow-lg flex flex-col justify-between h-full min-h-[450px]">
      
      <div>
        <h3 className="text-lg font-bold mb-6">Your Portfolio</h3>
        <div className="space-y-5">
          {portfolioData.map((item) => (
            <PortfolioItem key={item.label} {...item} total={totalValue} />
          ))}
        </div>
      </div>

      <div className="text-center flex flex-col items-center mt-6">
        <PiggyBankIcon className="w-16 h-16 mb-3 text-green-400" />
        <h3 className="text-lg font-bold mb-1">Need More Interest ?</h3>
        <p className="text-gray-400 text-sm mb-4">
          Fixed Deposits offer higher interest rates than regular savings accounts.
        </p>
        <button 
          onClick={() => window.location.hash = '#/home/packages'}
          className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-5 rounded-lg transition-colors text-sm"
        >
          Explore FD
        </button>
      </div>
    </div>
  );
}

export default PortfolioSummary;