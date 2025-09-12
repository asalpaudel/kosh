import React from 'react';

function Footer() {
  return (
    <footer className="h-12 flex items-center justify-center text-gray-500 text-sm border-t">
      © {new Date().getFullYear()} MyApp. All rights reserved.
    </footer>
  );
}

export default Footer;