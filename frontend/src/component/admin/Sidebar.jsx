import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboardIcon,
  LogOutIcon,
  Logo,
  ActivityIcon,
  FileTextIcon,
  UsersIcon, 
  PiggyBankIcon, 
} from "../icons.jsx"; 

function Sidebar() {
  const navLinkClass = ({ isActive }) =>
    `p-1.5 rounded-lg ${isActive ? "bg-gray-700" : ""}`;

  return (
    <div className="w-14 bg-black flex flex-col items-center justify-between py-6 h-screen sticky top-0">
      <div className="flex flex-col items-center space-y-6">
        <Logo />
        
        <NavLink to="/admin/dashboard" className={navLinkClass}>
          <LayoutDashboardIcon className="text-gray-300 h-7 w-7 transition-all duration-200 hover:scale-110 hover:text-white" />
        </NavLink>
        
        <NavLink to="/admin/users" className={navLinkClass}>
          <UsersIcon className="text-gray-300 h-7 w-7 transition-all duration-200 hover:scale-110 hover:text-white" />
        </NavLink>

        <NavLink to="/admin/packages" className={navLinkClass}>
          <PiggyBankIcon className="text-gray-300 h-7 w-7 transition-all duration-200 hover:scale-110 hover:text-white" />
        </NavLink>
        
        <NavLink to="/admin/transactions" className={navLinkClass}>
          <ActivityIcon className="text-gray-300 h-7 w-7 transition-all duration-200 hover:scale-110 hover:text-white" />
        </NavLink>
        
      </div>

      <NavLink to="/" className={navLinkClass}>
        <LogOutIcon className="text-gray-300 h-7 w-7 transition-all duration-200 hover:scale-110 hover:text-white" />
      </NavLink>
    </div>
  );
}

export default Sidebar;