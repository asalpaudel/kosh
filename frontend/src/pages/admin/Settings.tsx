import { useEffect, useState, type ComponentType } from "react";
import type { IconBaseProps } from "react-icons";
import { useLocation } from "react-router-dom";
import { UserIcon, ShieldIcon } from "../../component/icons";
import ProfileTab from "../../component/admin/settings/ProfileTab";
import SecurityTab from "../../component/admin/settings/SecurityTab";
import { isRecord } from "../../lib/validation";

type TabName = "Profile" | "Security";
const TABS: ReadonlyArray<{ name: TabName; icon: ComponentType<IconBaseProps> }> = [
  { name: "Profile", icon: UserIcon },
  { name: "Security", icon: ShieldIcon },
];

function requestedTab(state: unknown): TabName | null {
  if (!isRecord(state)) return null;
  return state.tab === "Profile" || state.tab === "Security" ? state.tab : null;
}

export default function AdminSettings() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabName>("Profile");

  useEffect(() => {
    const selected = requestedTab(location.state);
    if (selected) {
      setActiveTab(selected);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const content = activeTab === "Security" ? <SecurityTab /> : <ProfileTab />;
  return (
    <div className="bg-white p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-8.5rem)]">
      <div className="max-w-6xl">
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex flex-wrap -mb-px" aria-label="Tabs">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.name;
              return <button type="button" key={tab.name} onClick={() => { setActiveTab(tab.name); }} className={`flex items-center gap-2 whitespace-nowrap py-3 px-4 border-b-2 font-semibold text-sm ${active ? "border-teal-500 text-teal-600" : "border-transparent text-gray-500"}`}><Icon className="w-5 h-5" />{tab.name}</button>;
            })}
          </nav>
        </div>
        <div className="rounded-lg">{content}</div>
      </div>
    </div>
  );
}
