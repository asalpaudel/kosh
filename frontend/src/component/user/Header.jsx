import React from 'react';
import { SearchIcon, BellIcon, SettingsIcon } from '../icons';

function Header({ pageName }) {
  return (
    <header className="bg-black h-14 flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="text-white font-semibold text-2xl tracking-wide">{pageName}</h1>

      <div className="flex items-center space-x-5">
        <SearchIcon className="text-yellow-400 h-6 w-6 cursor-pointer"/>
        <BellIcon className="text-yellow-400 h-6 w-6 cursor-pointer"/>
        <SettingsIcon className="text-gray-400 h-6 w-6 cursor-pointer"/>
      </div>
    </header>
  );
}

export default Header;