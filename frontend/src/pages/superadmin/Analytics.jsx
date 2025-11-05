import React from 'react';
import AnalyticsChart from '../../component/superadmin/AnalyticsChart';

// Component for "Total Pool" and "Active Networks" items
const InfoItem = ({ label, value, color }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <span className="text-sm font-medium text-gray-300">{label}</span>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
    <div className="w-full bg-gray-700 rounded-full h-1.5">
      <div
        className={`${color} h-1.5 rounded-full`}
        // Simple percentage logic, adjust as needed
        style={{ width: `${Math.random() * 80 + 20}%` }} 
      ></div>
    </div>
  </div>
);

// "Total Pool" Card Component
const TotalPool = () => (
  <div className="bg-black text-white p-6 rounded-xl shadow-lg h-full">
    <h3 className="text-lg font-bold mb-6">Total Pool</h3>
    <div className="space-y-5">
      <InfoItem label="Total Saving" value="1300 Cr." color="bg-blue-500" />
      <InfoItem label="Total Credit" value="25 Cr." color="bg-teal-400" />
      <InfoItem label="Total Reserve" value="1325 Cr." color="bg-green-500" />
    </div>
  </div>
);

// "Active Networks" Card Component
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

function Analytics() {
  return (
    <div className="bg-gray-50 p-4">
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content Area (Chart + Summary) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Main Bar Chart */}
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <AnalyticsChart />
            </div>
            
            {/* Summary Text Box */}
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Summary</h2>
              <p className="text-gray-600 leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
            </div>
          </div>

          {/* Right Sidebar (Pools + Networks) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <TotalPool />
            <ActiveNetworks />
          </div>

        </div>
      </div>
    </div>
  );
}

export default Analytics;