import React from 'react';
import NetworkDonutChart from '../../component/superadmin/NetworkDonutChart';

// Small component for the "Total Networks" list
const NetworkTotalItem = ({ label, value }) => (
  <div className="flex justify-between items-center py-3">
    <span className="text-gray-600 font-medium">{label}</span>
    <span className="text-gray-900 font-bold">{value}</span>
  </div>
);

// Small component for the "Recently Added" list
const RecentNetworkItem = ({ name, date, type, value }) => (
  <div className="grid grid-cols-4 items-center py-3 border-b last:border-b-0">
    <div>
      <p className="font-bold text-gray-900">{name}</p>
      <p className="text-sm text-gray-500">{date}</p>
    </div>
    <span className="text-gray-700">{type}</span>
    <span className="text-gray-900 font-medium">{value}</span>
    {/* Empty div for 4th column alignment */}
    <span></span>
  </div>
);

function SuperadminDashboard() {
  
  // Mock data based on your screenshot
  const recentNetworks = [
    { name: 'Geda Sahakari', date: '13-Apr-2025', type: 'Basic', value: 450 },
    { name: 'Barshat Gay', date: '1-Apr-2025', type: 'Premium', value: 500 },
    { name: 'Sid kallo', date: '1-Apr-2025', type: 'Custom', value: 900 },
    { name: 'Asal Sano', date: '1-Apr-2025', type: 'Basic', value: 1000 },
  ];

  return (
    <div className="bg-gray-50 p-4">
      <div className="container mx-auto py-6">

        {/* Top Section: Chart + Summaries */}
        <div className="bg-white p-8 rounded-2xl shadow-lg mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Donut Chart */}
            <div className="lg:col-span-1 min-h-[300px]">
              <NetworkDonutChart />
            </div>
            
            {/* Totals & Active Users */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Total Networks List */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Total Networks</h3>
                <div className="divide-y">
                  <NetworkTotalItem label="Total Networks" value="Rs. 1,30,000.00" />
                  <NetworkTotalItem label="Total Basic" value="Rs. 1,30,000.00" />
                  <NetworkTotalItem label="Total Premium" value="Rs. 1,30,000.00" />
                  <NetworkTotalItem label="Total Custom" value="Rs. 1,30,000.00" />
                </div>
              </div>

              {/* Active Users Placeholder */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Active Users</h3>
                <div className="bg-gray-100 h-full min-h-[150px] rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 italic">Active users chart or list goes here</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Bottom Section: Recent Networks + Shortcuts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recently Added Network */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Recently Added Network</h3>
            {/* Header */}
            <div className="grid grid-cols-4 items-center pb-3 border-b text-sm font-semibold text-gray-500">
              <span>Name</span>
              <span>Type</span>
              <span>Value</span>
            </div>
            {/* List */}
            <div>
              {recentNetworks.map((network, index) => (
                <RecentNetworkItem key={index} {...network} />
              ))}
            </div>
          </div>

          {/* Shortcuts */}
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Shortcuts</h3>
            <div className="space-y-3">
              <button className="w-full text-left font-medium text-blue-600 hover:underline">
                Add New Network
              </button>
              <button className="w-full text-left font-medium text-blue-600 hover:underline">
                Manage Users
              </button>
              <button className="w-full text-left font-medium text-blue-600 hover:underline">
                System Settings
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default SuperadminDashboard;