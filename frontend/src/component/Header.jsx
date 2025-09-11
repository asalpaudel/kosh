import React from 'react';
import { LeafIcon, SearchIcon, BellIcon, SettingsIcon } from './Icons';

function Header() {
  return (
    <header className="bg-black h-14 flex items-center justify-between px-6">
      <div className="flex items-center space-x-3">
        {/* Logo */}
        <div className="text-green-400">
          <LeafIcon className="h-7 w-7" />
        </div>
        <h1 className="text-white font-semibold text-base tracking-wide">PAGE_NAME</h1>
      </div>

      {/* Header Actions */}
      <div className="flex items-center space-x-5">
        <SearchIcon className="text-yellow-400 h-6 w-6 cursor-pointer"/>
        <BellIcon className="text-yellow-400 h-6 w-6 cursor-pointer"/>
        <SettingsIcon className="text-gray-400 h-6 w-6 cursor-pointer"/>
      </div>
    </header>
  );
}

export default Header;