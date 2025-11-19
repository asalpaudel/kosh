import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountSummary from '../../component/user/AccountSummary';
import FinancialChart from '../../component/user/FinancialChart';
import TransactionsList from '../../component/user/TransactionsList';
import LoanAd from '../../component/user/LoanAd';

const apiBase = "http://localhost:8080/api";

function Dashboard() {
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
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
    <div className="min-h-screen bg-white p-4">
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div className="col-span-full">
            <AccountSummary
              sahakariId={sessionData.sahakariId}
              userEmail={sessionData.userEmail}
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3 flex flex-col gap-6">
            <FinancialChart sahakariId={sessionData.sahakariId} />
            <TransactionsList sahakariId={sessionData.sahakariId} />
          </div>

          <div className="md:col-span-1 lg:col-span-1">
            <LoanAd sahakariId={sessionData.sahakariId} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;