import { API_BASE } from "../../lib/apiClient";
import React, { useState, useEffect } from 'react';
import { SearchIcon, SettingsIcon } from '../icons';
import { useNavigate } from 'react-router-dom';
import GlobalSearch from './GlobalSearch';


function Header({ pageName }) {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchSessionUser = async () => {
      try {
        const response = await fetch(`${API_BASE}/session`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setUserName(data.userName || "Admin");
        }
      } catch (error) {
        console.error("Failed to load session user:", error);
      }
    };

    fetchSessionUser();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="bg-black h-16 md:h-20 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
        <div>
          <h1 className="text-white font-semibold text-lg md:text-2xl">{pageName}</h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <span className="text-gray-400 font-medium text-xs md:text-sm hidden lg:block">
            Hello, <span className="text-emerald-400">{userName || "..."}</span>
          </span>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-3 rounded-xl hover:bg-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 group"
            title="Search (Ctrl+K)"
          >
            <SearchIcon className="text-gray-400 group-hover:text-emerald-400 h-6 w-6 transition-transform group-hover:scale-110" />
          </button>

          <button
            className="p-3 rounded-xl hover:bg-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 group"
            onClick={() => navigate('/home/settings')}
          >
            <SettingsIcon className="text-gray-400 group-hover:text-emerald-400 h-6 w-6 transition-transform group-hover:scale-110" />
          </button>
        </div>
      </header>

      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

export default Header;