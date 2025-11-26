import React, { useEffect, useState } from "react";
import AnalyticsChart, { generateSummary } from "../../component/superadmin/AnalyticsChart";

const API_BASE = "http://localhost:8080/api";

const InfoItem = ({ label, value, color, percentage }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <span className="text-sm font-medium text-gray-300">{label}</span>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
    <div className="w-full bg-gray-700 rounded-full h-2">
      <div
        className={`${color} h-2 rounded-full transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  </div>
);

const TotalRevenue = ({ totals }) => {
  const totalSum = (totals.basic || 0) + (totals.premium || 0) + (totals.custom || 0);

  return (
    <div className="bg-black text-white p-6 rounded-xl shadow-lg h-full">
      <h3 className="text-lg font-bold mb-6">Total Revenue</h3>
      <div className="space-y-5">
        <InfoItem
          label="Basic Revenue"
          value={`Rs. ${(totals.basic || 0).toLocaleString()}`}
          color="bg-blue-500"
          percentage={totalSum ? (totals.basic / totalSum) * 100 : 0}
        />
        <InfoItem
          label="Premium Revenue"
          value={`Rs. ${(totals.premium || 0).toLocaleString()}`}
          color="bg-green-500"
          percentage={totalSum ? (totals.premium / totalSum) * 100 : 0}
        />
        <InfoItem
          label="Custom Revenue"
          value={`Rs. ${(totals.custom || 0).toLocaleString()}`}
          color="bg-yellow-500"
          percentage={totalSum ? (totals.custom / totalSum) * 100 : 0}
        />
      </div>
    </div>
  );
};

const ActiveNetworks = () => (
  <div className="bg-black text-white p-6 rounded-xl shadow-lg h-full">
    <h3 className="text-lg font-bold mb-6">Active Networks</h3>
    <div className="space-y-5">
      <InfoItem label="Networks" value="130" color="bg-blue-500" percentage={80} />
      <InfoItem label="Admins" value="150" color="bg-teal-400" percentage={65} />
      <InfoItem label="Staffs" value="1,150" color="bg-green-500" percentage={45} />
      <InfoItem label="Users" value="30,000" color="bg-red-500" percentage={90} />
    </div>
  </div>
);

function Analytics() {
  const [totals, setTotals] = useState({ basic: 0, premium: 0, custom: 0 });
  const [monthlyRevenueData, setMonthlyRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const totalRes = await fetch(`${API_BASE}/analytics/total-revenue`, {
          credentials: "include",
        });
        const totalData = await totalRes.json();
        setTotals(totalData || { basic: 0, premium: 0, custom: 0 });

        const monthlyRes = await fetch(`${API_BASE}/analytics/monthly-revenue`, {
          credentials: "include",
        });
        
        if (monthlyRes.ok) {
           const monthlyData = await monthlyRes.json();
           setMonthlyRevenueData(monthlyData || []);
        } else {
           console.error("Failed to fetch monthly revenue");
           setMonthlyRevenueData([]); 
        }

      } catch (err) {
        console.error("Error loading analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-gray-50 p-4 min-h-screen">
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <AnalyticsChart monthlyData={monthlyRevenueData} />
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Summary</h2>
              {loading ? (
                 <p className="text-gray-500">Loading summary...</p>
              ) : (
                 <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                   {generateSummary(monthlyRevenueData, totals)}
                 </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-6">
            <TotalRevenue totals={totals} />
            <ActiveNetworks />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;