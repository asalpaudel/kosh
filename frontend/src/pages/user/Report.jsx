import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FinancialChart from '../../component/user/FinancialChart';
import PortfolioSummary from '../../component/user/PortfolioSummary';

const apiBase = "http://localhost:8080/api";

function Report() {
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
      <div className="bg-white p-4 flex items-center justify-center min-h-[calc(100vh-8.5rem)]">
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
    <div className="bg-white p-4"> 
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div>
              <FinancialChart sahakariId={sessionData.sahakariId} />
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-2xl font-bold mb-4">Summary</h2>
              <p className="text-gray-600">
                Based on your financial activity over the last year, your savings have shown a consistent upward trend, increasing by 15% overall. There was a notable peak in the third quarter, followed by a slight dip, which has now stabilized. Your loan payments are on schedule, and interest accruals are within the expected range. We recommend continuing your current savings plan and exploring investment options to further grow your portfolio.
              </p>
            </div>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-6">
            <PortfolioSummary sahakariId={sessionData.sahakariId} /> 
          </div>

        </div>
      </div>
    </div>
  );
}

export default Report;