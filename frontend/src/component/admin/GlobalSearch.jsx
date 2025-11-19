import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  SearchIcon, 
  UserCircleIcon, 
  LayoutDashboardIcon, 
  FileTextIcon, 
  UsersIcon, 
  PiggyBankIcon, 
  SettingsIcon,
  PlusCircleIcon,
  DocumentTextIcon
} from '../icons';

const API_BASE = "http://localhost:8080/api";

export default function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ pages: [], users: [], transactions: [], actions: [] });
  const [adminSahakari, setAdminSahakari] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  const pages = [
    { name: "Dashboard", path: "/admin/dashboard", icon: <LayoutDashboardIcon className="w-5 h-5" /> },
    { name: "Manage Users", path: "/admin/users", icon: <UsersIcon className="w-5 h-5" /> },
    { name: "Transactions", path: "/admin/transactions", icon: <FileTextIcon className="w-5 h-5" /> },
    { name: "Packages", path: "/admin/packages", icon: <PiggyBankIcon className="w-5 h-5" /> },
    { name: "Settings", path: "/admin/settings", icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  const staticActions = [
    { name: "Add User", type: "action", actionCode: "openAddUser", path: "/admin/users", icon: <PlusCircleIcon className="w-5 h-5 text-green-500" /> },
    { name: "Add Transaction", type: "action", actionCode: "openAddTxn", path: "/admin/transactions", icon: <PlusCircleIcon className="w-5 h-5 text-blue-500" /> },
  ];

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`${API_BASE}/session`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if(data.sahakariId) {
             const netRes = await fetch(`${API_BASE}/networks/${data.sahakariId}`, { credentials: "include" });
             if(netRes.ok) {
                const netData = await netRes.json();
                setAdminSahakari(netData.name);
             }
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    if (isOpen) fetchSession();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) setTimeout(() => inputRef.current.focus(), 50);
    if (!isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!query) {
        setResults({ pages: [], users: [], transactions: [], actions: [] });
        return;
      }

      const lowerQuery = query.toLowerCase();
      const matchingPages = pages.filter(p => p.name.toLowerCase().includes(lowerQuery));
      const matchingActions = staticActions.filter(a => a.name.toLowerCase().includes(lowerQuery));

      let matchingUsers = [];
      let matchingTransactions = [];

      if (adminSahakari) {
        try {
            const userRes = await fetch(`${API_BASE}/users?search=${query}`, { credentials: "include" });
            if (userRes.ok) {
                const allUsers = await userRes.json();
                matchingUsers = allUsers.filter(u => 
                    u.sahakari === adminSahakari && 
                    (u.name.toLowerCase().includes(lowerQuery) || u.email.toLowerCase().includes(lowerQuery))
                ).slice(0, 3);
            }

            const txnRes = await fetch(`${API_BASE}/transactions`, { credentials: "include" });
            if (txnRes.ok) {
                const allTxns = await txnRes.json();
                matchingTransactions = allTxns.filter(t => 
                    (t.transactionId && t.transactionId.toLowerCase().includes(lowerQuery)) ||
                    (t.voucherId && t.voucherId.toLowerCase().includes(lowerQuery)) ||
                    (String(t.id) === lowerQuery)
                ).slice(0, 3);
            }

        } catch (error) {
            console.error(error);
        }
      }

      setResults({ 
          pages: matchingPages, 
          users: matchingUsers, 
          transactions: matchingTransactions, 
          actions: matchingActions 
      });
      setSelectedIndex(0);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, adminSahakari]);

  const flatResults = useMemo(() => {
    return [
      ...results.actions.map(i => ({ ...i, category: 'action' })),
      ...results.pages.map(i => ({ ...i, category: 'page' })),
      ...results.transactions.map(i => ({ ...i, category: 'transaction' })),
      ...results.users.map(i => ({ ...i, category: 'user' }))
    ];
  }, [results]);

  const handleNavigation = (item) => {
    if (!item) return;
    
    if (item.category === 'action') {
      navigate(item.path, { state: { action: item.actionCode } });
    } else if (item.category === 'page') {
      navigate(item.path);
    } else if (item.category === 'transaction') {
      navigate("/admin/transactions", { state: { openTransactionId: item.id } });
    } else if (item.category === 'user') {
      navigate("/admin/users", { state: { searchQuery: item.name } });
    }
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % flatResults.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + flatResults.length) % flatResults.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (flatResults[selectedIndex]) {
            handleNavigation(flatResults[selectedIndex]);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatResults, selectedIndex]);

  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm transition-opacity"
      onMouseDown={onClose}
    >
      <div 
        className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-gray-200 p-4 gap-3">
          <SearchIcon className="w-6 h-6 text-teal-500" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 text-xl outline-none text-gray-700 placeholder-gray-400 bg-transparent"
            placeholder="Search users, vouchers, pages or actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="hidden sm:block bg-gray-100 px-2 py-1 rounded text-xs text-gray-500 font-mono">ESC</kbd>
        </div>

        <div className="overflow-y-auto p-2 space-y-1" ref={listRef}>
          {flatResults.map((item, index) => {
            const isSelected = index === selectedIndex;
            let icon, title, subtitle;

            if (item.category === 'action') {
              icon = item.icon;
              title = item.name;
              subtitle = "Quick Action";
            } else if (item.category === 'page') {
              icon = <div className="text-gray-500">{item.icon}</div>;
              title = item.name;
              subtitle = "Navigation";
            } else if (item.category === 'transaction') {
              icon = <DocumentTextIcon className="w-5 h-5 text-orange-500" />;
              title = `Voucher: ${item.voucherId || 'N/A'}`;
              subtitle = `ID: ${item.transactionId} • ${item.amount}`;
            } else {
              icon = <UserCircleIcon className="w-5 h-5 text-teal-600" />;
              title = item.name;
              subtitle = `${item.email} • ${item.role}`;
            }

            return (
              <div 
                key={`${item.category}-${item.id || item.path || item.name}`}
                onClick={() => handleNavigation(item)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer group transition-colors border-l-4 ${
                  isSelected ? 'bg-gray-100 border-teal-500' : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <div className="p-2 bg-white shadow-sm border border-gray-100 rounded-md">
                  {icon}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800 text-sm">{title}</span>
                  <span className="text-xs text-gray-500">{subtitle}</span>
                </div>
                {isSelected && <span className="ml-auto text-xs text-teal-600 font-bold">↵ Enter</span>}
              </div>
            );
          })}

          {query && flatResults.length === 0 && (
             <div className="p-8 text-center text-gray-500">No results found for "{query}"</div>
          )}
        </div>
        
        <div className="bg-gray-50 p-2 border-t text-center text-xs text-gray-400">
           Use arrows to navigate • Enter to select
        </div>
      </div>
    </div>
  );
}