import React, { useState, useEffect } from 'react';
import { SearchIcon, BellIcon, SettingsIcon } from '../icons';
import { useNavigate } from 'react-router-dom';

function Header({ pageName }) {
  const navigate = useNavigate();
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
          if (data.userName) {
            setUserName(data.userName);
          } else {
            setUserName("User");
          }
        }
      } catch (error) {
        console.error("Failed to load session user:", error);
      }
    };

    fetchSessionUser();
  }, []);

  return (
    <header className="bg-black h-14 flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="text-white font-semibold text-2xl tracking-wide">{pageName}</h1>

      <div className="flex items-center space-x-5">
        <span className="text-teal-400 font-medium text-sm hidden sm:block">
           Hello, {userName || "..."}
        </span>

        <SearchIcon className="text-yellow-400 h-6 w-6 cursor-pointer"/>

        <BellIcon className="text-yellow-400 h-6 w-6 cursor-pointer"/>

        <SettingsIcon
          className="text-gray-400 h-6 w-6 cursor-pointer hover:text-white transition-colors"
          onClick={() => navigate('/home/settings')}
        />
      </div>
    </header>
  );
}

export default Header;