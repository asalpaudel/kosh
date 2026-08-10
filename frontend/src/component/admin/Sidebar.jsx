import { API_BASE } from "../../lib/apiClient";
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboardIcon,
  LogOutIcon,
  Logo,
  ActivityIcon,
  FileTextIcon,
  UsersIcon,
  PiggyBankIcon,
  ClipboardListIcon,
} from "../icons.jsx";
import ConfirmationModal from "../ConfirmationModal.jsx";

function Sidebar() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const navLinkClass = ({ isActive }) =>
    `group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 relative ${isActive
      ? "bg-emerald-500/20 text-emerald-400"
      : "text-gray-400 hover:bg-gray-900 hover:text-white"
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 w-full ${isActive
      ? "bg-emerald-500/20 text-emerald-400"
      : "text-gray-400 hover:bg-gray-900 hover:text-white"
    }`;

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
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

          <NavLink to="/admin/dashboard" className={navLinkClass} title="Dashboard">
            <LayoutDashboardIcon className="h-6 w-6 transition-transform group-hover:scale-110" />
          </NavLink>

          <NavLink to="/admin/transactions" className={navLinkClass} title="Transactions">
            <FileTextIcon className="h-6 w-6 transition-transform group-hover:scale-110" />
          </NavLink>

          <NavLink to="/admin/users" className={navLinkClass} title="Users">
            <UsersIcon className="h-6 w-6 transition-transform group-hover:scale-110" />
          </NavLink>

          <NavLink to="/admin/packages" className={navLinkClass} title="Packages">
            <PiggyBankIcon className="h-6 w-6 transition-transform group-hover:scale-110" />
          </NavLink>

          <NavLink to="/admin/applications" className={navLinkClass} title="Applications">
            <ClipboardListIcon className="h-6 w-6 transition-transform group-hover:scale-110" />
          </NavLink>

          <NavLink to="/admin/history" className={navLinkClass} title="History">
            <ActivityIcon className="h-6 w-6 transition-transform group-hover:scale-110" />
          </NavLink>
        </div>

        <button
          onClick={() => setIsLogoutModalOpen(true)}
          className="group p-3 rounded-xl text-red-400 hover:bg-red-500/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
          title="Logout"
        >
          <LogOutIcon className="h-6 w-6 transition-transform group-hover:scale-110" />
        </button>
      </div>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out of your account?"
        confirmText="Logout"
        type="danger"
      />

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black z-50">
        <div className="flex items-center justify-around py-2 px-2">
          <NavLink to="/admin/dashboard" className="flex flex-col items-center p-2 text-xs">
            {({ isActive }) => (
              <>
                <LayoutDashboardIcon className={`h-5 w-5 mb-1 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
                <span className={isActive ? 'text-emerald-400' : 'text-gray-400'}>Dashboard</span>
              </>
            )}
          </NavLink>

          <NavLink to="/admin/transactions" className="flex flex-col items-center p-2 text-xs">
            {({ isActive }) => (
              <>
                <FileTextIcon className={`h-5 w-5 mb-1 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
                <span className={isActive ? 'text-emerald-400' : 'text-gray-400'}>Transactions</span>
              </>
            )}
          </NavLink>

          <NavLink to="/admin/users" className="flex flex-col items-center p-2 text-xs">
            {({ isActive }) => (
              <>
                <UsersIcon className={`h-5 w-5 mb-1 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
                <span className={isActive ? 'text-emerald-400' : 'text-gray-400'}>Users</span>
              </>
            )}
          </NavLink>

          <NavLink to="/admin/packages" className="flex flex-col items-center p-2 text-xs">
            {({ isActive }) => (
              <>
                <PiggyBankIcon className={`h-5 w-5 mb-1 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
                <span className={isActive ? 'text-emerald-400' : 'text-gray-400'}>Packages</span>
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
              <NavLink
                to="/admin/applications"
                className={mobileNavLinkClass}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ClipboardListIcon className="h-5 w-5" />
                <span>Applications</span>
              </NavLink>

              <NavLink
                to="/admin/history"
                className={mobileNavLinkClass}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ActivityIcon className="h-5 w-5" />
                <span>History</span>
              </NavLink>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsLogoutModalOpen(true);
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