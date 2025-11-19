import React, { useEffect, useState } from "react";
import AnalyticsChart from "../../component/superadmin/AnalyticsChart";

// Progress bar component
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

// Total Revenue Card
const TotalRevenue = () => {
  const [totals, setTotals] = useState({ basic: 0, premium: 0, custom: 0 });

  useEffect(() => {
    fetch("http://localhost:8080/api/analytics/total-revenue", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setTotals(data))
      .catch((err) => console.error(err));
  }, []);

  const totalSum = totals.basic + totals.premium + totals.custom;

  return (
    <div className="bg-black text-white p-6 rounded-xl shadow-lg h-full">
      <h3 className="text-lg font-bold mb-6">Total Revenue</h3>
      <div className="space-y-5">
        <InfoItem
          label="Basic Revenue"
          value={`$ ${totals.basic}`}
          color="bg-blue-500"
          percentage={totalSum ? (totals.basic / totalSum) * 100 : 0}
        />
        <InfoItem
          label="Premium Revenue"
          value={`$ ${totals.premium}`}
          color="bg-green-500"
          percentage={totalSum ? (totals.premium / totalSum) * 100 : 0}
        />
        <InfoItem
          label="Custom Revenue"
          value={`$ ${totals.custom}`}
          color="bg-yellow-500"
          percentage={totalSum ? (totals.custom / totalSum) * 100 : 0}
        />
      </div>
    </div>
  );
};

// Active Networks Card
const ActiveNetworks = () => (
  <div className="bg-black text-white p-6 rounded-xl shadow-lg h-full">
    <h3 className="text-lg font-bold mb-6">Active Networks</h3>
    <div className="space-y-5">
      <InfoItem label="Networks" value="13,00,00,000" color="bg-blue-500" />
      <InfoItem label="Admins" value="1,50,00,000" color="bg-teal-400" />
      <InfoItem label="Staffs" value="11,50,00,000" color="bg-green-500" />
      <InfoItem label="Users" value="30,00,000" color="bg-red-500" />
    </div>
  </div>
);

// Main Analytics Page
function Analytics() {
  return (
    <div className="bg-gray-50 p-4 min-h-screen">
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left/Main Content */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <AnalyticsChart />
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Summary</h2>
              <p className="text-gray-600 leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <TotalRevenue />
            <ActiveNetworks />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
