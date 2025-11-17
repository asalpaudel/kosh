import React, { useState } from "react";

const Toggle = ({ label, description, id }) => {
  const [isChecked, setIsChecked] = useState(true); // Default to on
  return (
    <div className="flex items-center justify-between">
      <div>
        <label htmlFor={id} className="font-semibold text-gray-800 cursor-pointer">{label}</label>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          id={id}
          checked={isChecked}
          onChange={() => setIsChecked(!isChecked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-teal-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
      </label>
    </div>
  );
};

function NotificationsTab() {
  return (
    <div className="max-w-3xl p-5 border border-gray-200 rounded-lg">
      <h3 className="text-xl font-semibold mb-6">Email Notifications</h3>
      <div className="space-y-6">
        <Toggle
          id="tx-notify"
          label="New Transactions"
          description="Get an email for every deposit or withdrawal."
        />
        <Toggle
          id="loan-notify"
          label="Loan Status Updates"
          description="Notify me when a loan application is approved or rejected."
        />
        <Toggle
          id="news-notify"
          label="Sahakari News"
          description="Receive news and announcements from your sahakari."
        />
        <Toggle
          id="security-notify"
          label="Security Alerts"
          description="Get an email for unusual account activity."
        />
      </div>
    </div>
  );
}

export default NotificationsTab;