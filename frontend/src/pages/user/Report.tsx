import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FinancialChart from "../../component/user/FinancialChart";
import PortfolioSummary from "../../component/user/PortfolioSummary";
import { API_BASE, apiFetch } from "../../lib/apiClient";
import { isRecord } from "../../lib/validation";

function Report() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await apiFetch(`${API_BASE}/session`);
        const data: unknown = await response.json();
        if (!isRecord(data) || typeof data.userEmail !== "string") throw new Error("Invalid session");
        setAuthorized(true);
      } catch {
        void navigate("/");
      } finally {
        setLoading(false);
      }
    };
    void fetchSession();
  }, [navigate]);

  if (loading) return (
    <div className="bg-white p-4 flex items-center justify-center min-h-[calc(100vh-8.5rem)]">
      <p className="text-gray-500">Loading...</p>
    </div>
  );

  if (!authorized) return null;

  return (
    <div className="bg-white p-4"> 
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Chart Section */}
            <div>
              <FinancialChart />
            </div>
            
            {/* Dynamic Summary Section */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Summary</h2>
              <p className="text-gray-600 leading-relaxed">
                This report is calculated from transactions returned for your authenticated server session. Use the period controls to review balance changes over time.
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
