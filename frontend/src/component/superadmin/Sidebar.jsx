import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboardIcon,
  LogOutIcon,
  Logo,
  BarChartIcon,
  FileTextIcon,
  UsersIcon,
} from "../icons.jsx";

function Sidebar() {
  const navLinkClass = ({ isActive }) =>
    `p-1.5 rounded-lg ${isActive ? "bg-gray-700" : ""}`;

  return (
    <div className="w-14 bg-black flex flex-col items-center justify-between py-6 h-screen sticky top-0">
      <div className="flex flex-col items-center space-y-6">
        <Logo />
        
        <NavLink to="/superadmin/dashboard" className={navLinkClass}>
          <LayoutDashboardIcon className="text-gray-300 h-7 w-7 transition-all duration-200 hover:scale-110 hover:text-white" />
        </NavLink>

        <NavLink to="/superadmin/networks" className={navLinkClass}>
          <UsersIcon className="text-gray-300 h-7 w-7 transition-all duration-200 hover:scale-110 hover:text-white" />
        </NavLink>
        
        <NavLink to="/superadmin/analytics" className={navLinkClass}>
          <BarChartIcon className="text-gray-300 h-7 w-7 transition-all duration-200 hover:scale-110 hover:text-white" />
        </NavLink>

        <NavLink to="/superadmin/history" className={navLinkClass}>
          <FileTextIcon className="text-gray-300 h-7 w-7 transition-all duration-200 hover:scale-110 hover:text-white" />
        </NavLink>
        
      </div>

      <NavLink to="/" className={navLinkClass}>
        <LogOutIcon className="text-gray-300 h-7 w-7 transition-all duration-200 hover:scale-110 hover:text-white" />
      </NavLink>
    </div>
  );
}

export default Sidebar;