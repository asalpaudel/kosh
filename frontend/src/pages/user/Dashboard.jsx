import React, { useState, useEffect } from "react";
import AccountSummary from "../../component/user/AccountSummary";
import FinancialChart from "../../component/user/FinancialChart";
import TransactionsList from "../../component/user/TransactionsList";
import LoanAd from "../../component/user/LoanAd";

const apiBase = "http://localhost:8080/api";

function Dashboard() {
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`${apiBase}/session`, {
          method: "GET",
          credentials: "include", // Important: Include cookies for session
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Session data:", data);
          setSessionData(data);

          // If user doesn't have sahakariId, redirect to login
          if (!data.sahakariId && data.userRole !== "superadmin") {
            console.error("No sahakariId found in session");
            window.location.href = "/";
          }
        } else {
          console.error("Failed to fetch session data");
          window.location.href = "/";
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        window.location.href = "/";
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  // Show loading state while fetching session
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-center text-gray-500">Loading session...</p>
      </div>
    );
  }

  // Show error if no session data
  if (!sessionData?.sahakariId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-center text-red-500">
          Unable to load session. Please login again.
        </p>
      </div>
    );
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
