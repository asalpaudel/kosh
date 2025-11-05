/* src/component/superadmin/Sidebar.jsx */
import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboardIcon,
  LogOutIcon,
  Logo,
  UsersIcon, 
} from "../icons";

function Sidebar() {
  const navLinkClass = ({ isActive }) =>
    `p-1.5 rounded-lg ${isActive ? "bg-gray-700" : ""}`;

  return (
    <div className="w-14 bg-black flex flex-col items-center justify-between py-6 h-screen sticky top-0">
      <div className="flex flex-col items-center space-y-6">
        <Logo />
        <NavLink to="/superadmin/dashboard" className={navLinkClass}>
          <LayoutDashboardIcon className="text-purple-400 h-7 w-7 transition-transform duration-200 hover:scale-110" />
        </NavLink>
        {/* You can add more superadmin-specific links here, e.g., User Management */}
        {/* <NavLink to="/superadmin/users" className={navLinkClass}>
          <UsersIcon className="text-blue-400 h-7 w-7 transition-transform duration-200 hover:scale-110" />
        </NavLink> */}
      </div>

      <NavLink to="/" className={navLinkClass}>
        <LogOutIcon className="text-yellow-400 h-7 w-7 transition-transform duration-200 hover:scale-110" />
      </NavLink>
    </div>
  );
}

export default Sidebar;