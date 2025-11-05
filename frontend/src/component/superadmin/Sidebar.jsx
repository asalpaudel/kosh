import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboardIcon,
  LogOutIcon,
  Logo,
  BarChartIcon,
  FileTextIcon,
  UsersIcon, // <-- IMPORTED UsersIcon
} from "../icons.jsx"; // Imports icons from the adjacent file

function Sidebar() {
  // Function to determine the class based on active state for NavLink
  const navLinkClass = ({ isActive }) =>
    `p-1.5 rounded-lg ${isActive ? "bg-gray-700" : ""}`;

  return (
    // The main container for the sticky sidebar
    <div className="w-14 bg-black flex flex-col items-center justify-between py-6 h-screen sticky top-0">
      <div className="flex flex-col items-center space-y-6">
        <Logo />
        
        {/* Dashboard Link */}
        <NavLink to="/superadmin/dashboard" className={navLinkClass}>
          <LayoutDashboardIcon className="text-purple-400 h-7 w-7 transition-transform duration-200 hover:scale-110" />
        </NavLink>

        {/* --- ADDED NETWORKS LINK --- */}
        <NavLink to="/superadmin/networks" className={navLinkClass}>
          <UsersIcon className="text-green-400 h-7 w-7 transition-transform duration-200 hover:scale-110" />
        </NavLink>
        
        {/* Analytics Link */}
        <NavLink to="/superadmin/analytics" className={navLinkClass}>
          <BarChartIcon className="text-orange-400 h-7 w-7 transition-transform duration-200 hover:scale-110" />
        </NavLink>

        {/* History Link */}
        <NavLink to="/superadmin/history" className={navLinkClass}>
          <FileTextIcon className="text-blue-400 h-7 w-7 transition-transform duration-200 hover:scale-110" />
        </NavLink>
        
      </div>

      {/* Logout Link at the bottom */}
      <NavLink to="/" className={navLinkClass}>
        <LogOutIcon className="text-yellow-400 h-7 w-7 transition-transform duration-200 hover:scale-110" />
      </NavLink>
    </div>
  );
}

export default Sidebar;