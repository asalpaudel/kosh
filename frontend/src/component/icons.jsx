import React from 'react';

export const LeafIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M11 20A7 7 0 0 1 4 13H2a10 10 0 0 0 10 10z"></path>
    <path d="M12 2a7 7 0 0 1 7 7h2a10 10 0 0 0-10-10z"></path>
    <path d="M12 22a10 10 0 0 0 10-10h-2a7 7 0 0 1-7 7z"></path>
    <path d="M2 12a10 10 0 0 0 10 10v-2a7 7 0 0 1-7-7z"></path>
  </svg>
);
export const Logo = ({ className }) => (
  <svg width="30" height="30" viewBox="0 0 189 235" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M54.6339 159.688C54.6339 161.055 54.1681 162.387 53.3071 163.458L34.2955 187.171L10.7546 218.031L10.7559 218.032C7.2741 222.599 0 220.129 0 214.383V96.8369C0.000311621 72.7101 19.0853 52.9297 43.1379 52.1278L45.3102 52.0548V44.7339C45.3102 20.0281 65.2876 0 89.9309 0H147.257C151.983 0 154.788 5.18751 152.382 9.12569L152.134 9.50256L118.563 56.6098C117.547 58.0358 115.964 58.9419 114.233 59.1005L113.885 59.1227L54.6339 61.097V159.688ZM9.32374 204.521L26.9658 181.394L27.0009 181.349L45.3102 158.51V61.4074L43.4475 61.47C24.4209 62.1044 9.32405 77.7516 9.32374 96.8369V204.521ZM54.6339 51.7444L111.932 49.834L140.786 9.34738H89.9309C70.437 9.34738 54.6339 25.1905 54.6339 44.7339V51.7444Z" fill="#3EEFB1"/>
  <path d="M133.138 183.254L75.2937 185.163L46.1673 225.653H97.5052C117.185 225.653 133.138 209.81 133.138 190.266V183.254ZM178.879 30.478L161.104 53.5622L161.068 53.6078L161.033 53.6509L142.551 76.4872V173.591L144.43 173.53C163.638 172.895 178.879 157.249 178.879 138.163V30.478ZM188.292 138.163C188.292 162.291 169.026 182.07 144.743 182.872L142.551 182.944V190.266C142.551 214.973 122.383 235 97.5052 235H39.6332C34.7126 235 31.8479 229.477 34.709 225.499L68.5994 178.39L68.6007 178.389C69.6989 176.864 71.4439 175.944 73.3122 175.879L73.3214 175.877L133.138 173.902V75.3123C133.138 73.9417 133.61 72.6179 134.464 71.5566L134.472 71.5475L153.669 47.8283L177.435 16.9669L177.603 16.7569C181.179 12.4802 188.292 14.9612 188.292 20.6169V138.163Z" fill="#3EEFB1"/>
  </svg>

);

export const SearchIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

export const BellIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

export const SettingsIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

export const LayoutDashboardIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

export const UsersIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="8.5" cy="7" r="4"></circle>
    <polyline points="17 11 19 13 23 9"></polyline>
  </svg>
);

export const MailIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
  </svg>
);

export const BarChartIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="20" x2="12" y2="10"></line>
    <line x1="18" y1="20" x2="18" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="16"></line>
  </svg>
);

export const FileTextIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

export const PlusCircleIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="16"></line>
    <line x1="8" y1="12" x2="16" y2="12"></line>
  </svg>
);

export const LogOutIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
);

export const PiggyBankIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8.5a4 4 0 0 1-8 0"/>
    <path d="M21 10h-2a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2"/>
    <path d="M21.5 10a8.5 8.5 0 0 0-18.01 1.43c0 3.24 2.14 5.92 5.01 6.57"/>
    <path d="M4.5 12H10"/>
    <path d="M2 14h6"/>
    <path d="M12 21.5V16"/>
  </svg>
);