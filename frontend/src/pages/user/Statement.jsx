import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon } from '../../component/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const apiBase = "http://localhost:8080/api";

function Statement() {
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);

  const transactions = Array(12).fill({
    date: '13-Apr-2025',
    description: 'Internet Expenses for the month',
    amount: '-Rs. 1,300.00',
    balance: 'Rs. 25,000.00',
  });

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`${apiBase}/session`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Session data:", data);
          
          // Check if session has error (no userEmail)
          if (data.error) {
            console.error("Session error:", data.error);
            navigate('/');
            return;
          }
          
          setSessionData(data);

          // If user doesn't have sahakariId, redirect to login
          if (!data.sahakariId && data.userRole !== "superadmin") {
            console.error("No sahakariId found in session");
            navigate('/');
          }
        } else if (response.status === 401) {
          console.error("Unauthorized - no session");
          navigate('/');
        } else {
          console.error("Failed to fetch session data");
          navigate('/');
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [navigate]);

  const handleExport = () => {
    const doc = new jsPDF();
    doc.text('Transaction Statement', 14, 20);
    
    const tableColumn = ["Date", "Description", "Amount", "Balance"];
    const tableRows = transactions.map(item => [
      item.date,
      item.description,
      item.amount,
      item.balance
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [34, 34, 34] },
    });

    doc.save('transaction-statement.pdf');
  };

  if (loading) {
    return (
      <div className="bg-gray-50 p-6 rounded-2xl shadow-lg flex items-center justify-center min-h-[calc(100vh-8.5rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!sessionData?.userEmail) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="bg-gray-50 p-6 rounded-2xl shadow-lg">
      <div className="container mx-auto">
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          <div className="relative flex-grow sm:flex-grow-0">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4">
              <SearchIcon className="h-6 w-6 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search..."
              className="w-full sm:w-200 bg-gray-200 text-gray-700 border border-transparent rounded-full py-3 pl-12 pr-4 text-base focus:outline-none focus:bg-white focus:border-gray-300"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <button className="bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-full hover:bg-gray-300 transition-colors text-base">
              1-Apr-25 to 15-Apr-25
            </button>
            <button className="bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-full hover:bg-gray-300 transition-colors text-base">
              1-Apr-25 to 15-Apr-25
            </button>
          </div>

          <div>
            <button 
              onClick={handleExport}
              className="bg-teal-500 text-white font-bold py-3 px-8 rounded-full hover:bg-teal-600 transition-colors text-base"
            >
              Export
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {transactions.map((transaction, index) => (
            <div key={index} className="grid grid-cols-4 gap-4 items-center bg-white p-4 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="text-gray-600 text-sm">{transaction.date}</div>
              <div className="text-gray-800 font-medium">{transaction.description}</div>
              <div className="text-red-500 font-semibold text-right">{transaction.amount}</div>
              <div className="text-gray-900 font-bold text-right">{transaction.balance}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Statement;