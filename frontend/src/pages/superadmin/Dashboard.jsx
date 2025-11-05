/* src/pages/superadmin/Dashboard.jsx */
import React from 'react';

// Example Stat Card component
const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
    <div>
      <span className="text-sm font-medium text-gray-500">{title}</span>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
    <div className="text-blue-500">
      {/* Placeholder for an icon */}
      {icon}
    </div>
  </div>
);

function SuperadminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto py-6">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard title="Total Users" value="1,250" />
          <StatCard title="Pending Approvals" value="32" />
          <StatCard title="Total Transactions" value="Rs. 10,50,000" />
          <StatCard title="System Health" value="Online" />
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* User Management Placeholder */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">User Management</h2>
            <p className="text-gray-600">
              A table or list of users would go here. You could include functionality
              to search, edit, delete, or approve new user signups.
            </p>
            {/* Example: <UserManagementTable /> */}
          </div>

          {/* System Logs Placeholder */}
          <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Activity Log</h2>
            <ul className="space-y-3">
              <li className="text-sm text-gray-700">
                <span className="font-semibold">User 'john.doe'</span> logged in. (1 min ago)
              </li>
              <li className="text-sm text-gray-700">
                <span className="font-semibold">New user 'jane.s'</span> pending approval. (5 mins ago)
              </li>
              <li className="text-sm text-gray-700">
                <span className="font-semibold">System backup</span> completed. (1 hour ago)
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}

export default SuperadminDashboard;