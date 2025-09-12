import React from "react";
import {
  LayoutDashboardIcon,
  UsersIcon,
  MailIcon,
  BarChartIcon,
  FileTextIcon,
  PlusCircleIcon,
  LogOutIcon,
} from "..icons/Icons";

function Sidebar() {
  return (
    <div className="w-14 bg-black flex flex-col items-center py-6 space-y-6">
      <LayoutDashboardIcon className="text-purple-400 h-7 w-7 cursor-pointer transition-transform duration-200 hover:scale-110" />
      <UsersIcon className="text-white h-7 w-7 cursor-pointer transition-transform duration-200 hover:scale-110" />
      <MailIcon className="text-red-400 h-7 w-7 cursor-pointer transition-transform duration-200 hover:scale-110" />
      <BarChartIcon className="text-orange-400 h-7 w-7 cursor-pointer transition-transform duration-200 hover:scale-110" />
      <FileTextIcon className="text-blue-400 h-7 w-7 cursor-pointer transition-transform duration-200 hover:scale-110" />
      <PlusCircleIcon className="text-green-400 h-7 w-7 cursor-pointer transition-transform duration-200 hover:scale-110" />

      <div className="flex-1"></div>

      <LogOutIcon className="text-yellow-400 h-7 w-7 cursor-pointer transition-transform duration-200 hover:scale-110" />
    </div>
  );
}

export default Sidebar;
