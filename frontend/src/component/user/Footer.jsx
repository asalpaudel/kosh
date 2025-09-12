import React from 'react';

function Footer() {
  return (
    <footer className="bg-black h-12 flex items-center justify-center text-gray-400 text-sm">
      © {new Date().getFullYear()} MyApp. All rights reserved.
    </footer>
  );
}

export default Footer;