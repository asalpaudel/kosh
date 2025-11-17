import React, { useState } from "react";
import { UserIcon, ShieldIcon, BellIcon, MoonIcon } from "../../component/icons";

// Import tab components (we will create these next)
import ProfileTab from "../../component/admin/settings/ProfileTab";
import SecurityTab from "../../component/admin/settings/SecurityTab";
import NotificationsTab from "../../component/admin/settings/NotificationsTab";
import AppearanceTab from "../../component/admin/settings/AppearanceTab";

const tabs = [
  { name: "Profile", icon: UserIcon },
  { name: "Security", icon: ShieldIcon },
  { name: "Notification", icon: BellIcon },
  { name: "Appearance", icon: MoonIcon },
];

function AdminSettings() {
  const [activeTab, setActiveTab] = useState(tabs[0].name);

  const renderTabContent = () => {
    switch (activeTab) {
      case "Profile":
        return <ProfileTab />;
      case "Security":
        return <SecurityTab />;
      case "Notification":
        return <NotificationsTab />;
      case "Appearance":
        return <AppearanceTab />;
      default:
        return <ProfileTab />;
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-8.5rem)]">
      <div className="max-w-6xl">


        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex flex-wrap -mb-px" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.name;
              return (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`
                    flex items-center gap-2
                    whitespace-nowrap py-3 px-4 border-b-2
                    font-semibold text-sm transition-colors
                    ${
                      isActive
                        ? "border-teal-500 text-teal-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-teal-500' : 'text-gray-400'}`} />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="rounded-lg">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;