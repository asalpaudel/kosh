import React, { useState } from 'react';
import { SearchIcon, BellIcon, SettingsIcon } from '../icons';
import { useNavigate } from 'react-router-dom';

function Header({ pageName }) {
  const navigate = useNavigate();

  return (
    <header className="bg-black h-16 md:h-20 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
      <div>
        <h1 className="text-white font-semibold text-lg md:text-2xl">{pageName}</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button 
          className="p-3 rounded-xl hover:bg-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 group"
          title="Search"
        >
          <SearchIcon className="text-gray-400 group-hover:text-emerald-400 h-6 w-6 transition-transform group-hover:scale-110"/>
        </button>
        
        <button className="p-3 rounded-xl hover:bg-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 relative group">
          <BellIcon className="text-gray-400 group-hover:text-emerald-400 h-6 w-6 transition-transform group-hover:scale-110"/>
          <span className="absolute top-2 right-2 h-2 w-2 bg-emerald-500 rounded-full"></span>
        </button>
        
        <button 
          className="p-3 rounded-xl hover:bg-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 group"
          onClick={() => navigate('/superadmin/settings')}
        >
          <SettingsIcon className="text-gray-400 group-hover:text-emerald-400 h-6 w-6 transition-transform group-hover:scale-110"/>
        </button>
      </div>
    </header>
  );
}

export default Header;