import React, { useState, useEffect } from 'react';
import { SearchIcon, BellIcon, SettingsIcon } from '../icons';
import { useNavigate } from 'react-router-dom';
import GlobalSearch from './GlobalSearch'; 

function Header({ pageName }) {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [userName, setUserName] = useState(""); 

  useEffect(() => {
    const fetchSessionUser = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/session", {
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
      <header className="bg-black h-14 flex items-center justify-between px-6 sticky top-0 z-10">
        <h1 className="text-white font-semibold text-2xl tracking-wide">{pageName}</h1>

        <div className="flex items-center space-x-5">
          <span className="text-teal-400 font-medium text-sm hidden sm:block">
             Hello, {userName || "..."}
          </span>

          <button 
            onClick={() => setIsSearchOpen(true)} 
            className="group flex items-center gap-2 focus:outline-none"
            title="Search (Ctrl+K)"
          >
            <SearchIcon className="text-yellow-400 h-6 w-6 cursor-pointer group-hover:scale-110 transition-transform"/>
            <span className="hidden md:block text-gray-500 text-sm group-hover:text-gray-300">Search...</span>
          </button>
          
          <BellIcon className="text-yellow-400 h-6 w-6 cursor-pointer hover:scale-110 transition-transform"/>
          
          <SettingsIcon 
            className="text-gray-400 h-6 w-6 cursor-pointer hover:text-white transition-colors"
            onClick={() => navigate('/admin/settings')}
          />
        </div>
      </header>

      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

export default Header;