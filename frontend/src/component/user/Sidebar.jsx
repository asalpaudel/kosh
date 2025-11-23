import React from "react";
import { NavLink, useNavigate } from "react-router-dom"; 
import {
  LayoutDashboardIcon,
  BarChartIcon,
  FileTextIcon,
  LogOutIcon,
  Logo,
  PiggyBankIcon,
  ClipboardListIcon, // Add this icon for applications
} from "../icons"; 

const API_BASE = "http://localhost:8080/api"; 

function Sidebar() {
  const navigate = useNavigate(); 
  
  const navLinkClass = ({ isActive }) =>
    `p-1.5 rounded-lg ${isActive ? "bg-gray-700" : ""}`;

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout API call failed:", error);
    }

    localStorage.clear();
    sessionStorage.clear();

    navigate("/");
  };

  return (
    <div className="w-14 bg-black flex flex-col items-center justify-between py-6 h-screen sticky top-0">
      <div className="flex flex-col items-center space-y-6">
        <Logo />
        
        <NavLink to="/home/dashboard" className={navLinkClass}>
          <LayoutDashboardIcon className="text-gray-300 h-7 w-7 transition-all duration-200 hover:scale-110 hover:text-white" />
        </NavLink>

        <NavLink to="/home/report" className={navLinkClass}>
          <BarChartIcon className="text-gray-300 h-7 w-7 transition-all duration-200 hover:scale-110 hover:text-white" />
        </NavLink>

        <NavLink to="/home/statement" className={navLinkClass}>
          <FileTextIcon className="text-gray-300 h-7 w-7 transition-all duration-200 hover:scale-110 hover:text-white" />
        </NavLink>

        <NavLink to="/home/packages" className={navLinkClass}>
          <PiggyBankIcon className="text-gray-300 h-7 w-7 transition-all duration-200 hover:scale-110 hover:text-white" />
        </NavLink>

        <NavLink to="/home/applications" className={navLinkClass} title="My Applications">
          <ClipboardListIcon className="text-gray-300 h-7 w-7 transition-all duration-200 hover:scale-110 hover:text-white" />
        </NavLink>
      </div>

      <button 
        onClick={handleLogout} 
        className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
        title="Logout"
      >
        <LogOutIcon className="text-red-400 h-7 w-7 transition-all duration-200 hover:scale-110 hover:text-red-500" />
      </button>
    </div>
  );
}

export default Sidebar;