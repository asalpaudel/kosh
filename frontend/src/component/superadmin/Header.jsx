import React, { useState } from 'react';
import { SearchIcon, SettingsIcon } from '../icons';
import { useNavigate } from 'react-router-dom';

function Header({ pageName }) {
  const navigate = useNavigate();

  return (
    <header className="bg-black h-16 md:h-20 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
      <div>
        <h1 className="text-white font-semibold text-lg md:text-2xl">{pageName}</h1>
      </div>


    </header>
  );
}

export default Header;