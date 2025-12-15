import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboardIcon,
  LogOutIcon,
  Logo,
  BarChartIcon,
  FileTextIcon,
  UsersIcon,
} from "../icons.jsx";

const API_BASE = "http://localhost:8080/api";

function Sidebar() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navLinkClass = ({ isActive }) =>
    `group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 relative ${
      isActive 
        ? "bg-emerald-500/20 text-emerald-400" 
        : "text-gray-400 hover:bg-gray-900 hover:text-white"
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 w-full ${
      isActive 
        ? "bg-emerald-500/20 text-emerald-400" 
        : "text-gray-400 hover:bg-gray-900 hover:text-white"
    }`;

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
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-20 bg-black flex-col items-center justify-between py-6 h-screen sticky top-0">
        <div className="flex flex-col items-center space-y-4">
          <div className="mb-4 p-2">
            <Logo className="w-8 h-8" />
          </div>
          
          <NavLink to="/superadmin/dashboard" className={navLinkClass} title="Dashboard">
            <LayoutDashboardIcon className="h-6 w-6 transition-transform group-hover:scale-110" />
          </NavLink>
          
          <NavLink to="/superadmin/networks" className={navLinkClass} title="Networks">
            <UsersIcon className="h-6 w-6 transition-transform group-hover:scale-110" />
          </NavLink>
          
          <NavLink to="/superadmin/analytics" className={navLinkClass} title="Analytics">
            <BarChartIcon className="h-6 w-6 transition-transform group-hover:scale-110" />
          </NavLink>

          <NavLink to="/superadmin/history" className={navLinkClass} title="History">
            <FileTextIcon className="h-6 w-6 transition-transform group-hover:scale-110" />
          </NavLink>
        </div>

        <button 
          onClick={handleLogout} 
          className="group p-3 rounded-xl text-red-400 hover:bg-red-500/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
          title="Logout"
        >
          <LogOutIcon className="h-6 w-6 transition-transform group-hover:scale-110" />
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black z-50">
        <div className="flex items-center justify-around py-2 px-2">
          <NavLink to="/superadmin/dashboard" className="flex flex-col items-center p-2 text-xs">
            {({ isActive }) => (
              <>
                <LayoutDashboardIcon className={`h-5 w-5 mb-1 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
                <span className={isActive ? 'text-emerald-400' : 'text-gray-400'}>Dashboard</span>
              </>
            )}
          </NavLink>
          
          <NavLink to="/superadmin/networks" className="flex flex-col items-center p-2 text-xs">
            {({ isActive }) => (
              <>
                <UsersIcon className={`h-5 w-5 mb-1 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
                <span className={isActive ? 'text-emerald-400' : 'text-gray-400'}>Networks</span>
              </>
            )}
          </NavLink>
          
          <NavLink to="/superadmin/analytics" className="flex flex-col items-center p-2 text-xs">
            {({ isActive }) => (
              <>
                <BarChartIcon className={`h-5 w-5 mb-1 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
                <span className={isActive ? 'text-emerald-400' : 'text-gray-400'}>Analytics</span>
              </>
            )}
          </NavLink>

          <NavLink to="/superadmin/history" className="flex flex-col items-center p-2 text-xs">
            {({ isActive }) => (
              <>
                <FileTextIcon className={`h-5 w-5 mb-1 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
                <span className={isActive ? 'text-emerald-400' : 'text-gray-400'}>History</span>
              </>
            )}
          </NavLink>

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex flex-col items-center p-2 text-xs text-gray-400"
          >
            <svg className="h-5 w-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>More</span>
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="absolute bottom-full left-0 right-0 bg-black">
            <div className="p-4 space-y-2">
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="group flex items-center gap-3 p-3 rounded-xl w-full text-red-400 hover:bg-red-500/20 transition-all duration-200"
              >
                <LogOutIcon className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Sidebar;