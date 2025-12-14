import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  SearchIcon,
  UserCircleIcon,
  LayoutDashboardIcon,
  FileTextIcon,
  UsersIcon,
  PiggyBankIcon,
  SettingsIcon,
  PlusCircleIcon,
  DocumentTextIcon,
  ShieldIcon,
  BellIcon,
  MoonIcon,
  BanknotesIcon,
  DocumentIcon,
  CurrencyDollarIcon,
} from "../icons";

const API_BASE = "http://localhost:8080/api";

export default function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({
    pages: [],
    users: [],
    transactions: [],
    actions: [],
  });
  const [adminSahakari, setAdminSahakari] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  const pages = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: <LayoutDashboardIcon className="w-5 h-5" />,
    },
    {
      name: "Manage Users",
      path: "/admin/users",
      icon: <UsersIcon className="w-5 h-5" />,
    },
    {
      name: "Transactions",
      path: "/admin/transactions",
      icon: <FileTextIcon className="w-5 h-5" />,
    },
    {
      name: "Packages",
      path: "/admin/packages",
      icon: <PiggyBankIcon className="w-5 h-5" />,
    },
    {
      name: "Applications",
      path: "/admin/applications",
      icon: <DocumentTextIcon className="w-5 h-5" />,
    },
    {
      name: "Settings",
      path: "/admin/settings",
      icon: <SettingsIcon className="w-5 h-5" />,
    },
  ];

  const staticActions = [
    {
      name: "Add User",
      type: "action",
      actionCode: "openAddUser",
      path: "/admin/users",
      icon: <PlusCircleIcon className="w-5 h-5 text-emerald-600" />,
    },
    {
      name: "Add Transaction",
      type: "action",
      actionCode: "openAddTxn",
      path: "/admin/transactions",
      icon: <PlusCircleIcon className="w-5 h-5 text-blue-600" />,
    },

    {
      name: "Add Fixed Deposit Package",
      type: "action",
      actionCode: "openAddFD",
      path: "/admin/packages",
      icon: <DocumentIcon className="w-5 h-5 text-cyan-600" />,
    },
    {
      name: "Add Saving Account Package",
      type: "action",
      actionCode: "openAddSaving",
      path: "/admin/packages",
      icon: <CurrencyDollarIcon className="w-5 h-5 text-cyan-600" />,
    },
    {
      name: "Add Loan Package",
      type: "action",
      actionCode: "openAddLoan",
      path: "/admin/packages",
      icon: <BanknotesIcon className="w-5 h-5 text-cyan-600" />,
    },

    {
      name: "Profile Settings",
      type: "setting",
      tab: "Profile",
      path: "/admin/settings",
      icon: <UserCircleIcon className="w-5 h-5 text-gray-600" />,
    },
    {
      name: "Security Settings",
      type: "setting",
      tab: "Security",
      path: "/admin/settings",
      icon: <ShieldIcon className="w-5 h-5 text-gray-600" />,
    },
    {
      name: "Change Password",
      type: "setting",
      tab: "Security",
      path: "/admin/settings",
      icon: <ShieldIcon className="w-5 h-5 text-gray-600" />,
    },
    {
      name: "Two-Factor Authentication (2FA)",
      type: "setting",
      tab: "Security",
      path: "/admin/settings",
      icon: <ShieldIcon className="w-5 h-5 text-gray-600" />,
    },
    {
      name: "Notification Settings",
      type: "setting",
      tab: "Notification",
      path: "/admin/settings",
      icon: <BellIcon className="w-5 h-5 text-gray-600" />,
    },
    {
      name: "Appearance / Theme",
      type: "setting",
      tab: "Appearance",
      path: "/admin/settings",
      icon: <MoonIcon className="w-5 h-5 text-gray-600" />,
    },
  ];

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`${API_BASE}/session`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.sahakariId) {
            const netRes = await fetch(
              `${API_BASE}/networks/${data.sahakariId}`,
              { credentials: "include" }
            );
            if (netRes.ok) {
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
    if (isOpen && inputRef.current)
      setTimeout(() => inputRef.current.focus(), 50);
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
      const matchingPages = pages.filter((p) =>
        p.name.toLowerCase().includes(lowerQuery)
      );
      const matchingActions = staticActions.filter((a) =>
        a.name.toLowerCase().includes(lowerQuery)
      );

      let matchingUsers = [];
      let matchingTransactions = [];

      if (adminSahakari) {
        try {
          const userRes = await fetch(`${API_BASE}/users?search=${query}`, {
            credentials: "include",
          });
          if (userRes.ok) {
            const allUsers = await userRes.json();
            matchingUsers = allUsers
              .filter(
                (u) =>
                  u.sahakari === adminSahakari &&
                  (u.name.toLowerCase().includes(lowerQuery) ||
                    u.email.toLowerCase().includes(lowerQuery))
              )
              .slice(0, 3);
          }

          const txnRes = await fetch(`${API_BASE}/transactions`, {
            credentials: "include",
          });
          if (txnRes.ok) {
            const allTxns = await txnRes.json();
            matchingTransactions = allTxns
              .filter(
                (t) =>
                  (t.transactionId &&
                    t.transactionId.toLowerCase().includes(lowerQuery)) ||
                  (t.voucherId &&
                    t.voucherId.toLowerCase().includes(lowerQuery)) ||
                  String(t.id) === lowerQuery
              )
              .slice(0, 3);
          }
        } catch (error) {
          console.error(error);
        }
      }

      setResults({
        pages: matchingPages,
        users: matchingUsers,
        transactions: matchingTransactions,
        actions: matchingActions,
      });
      setSelectedIndex(0);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, adminSahakari]);

  const flatResults = useMemo(() => {
    return [
      ...results.actions.map((i) => ({ ...i, category: "action" })),
      ...results.pages.map((i) => ({ ...i, category: "page" })),
      ...results.transactions.map((i) => ({ ...i, category: "transaction" })),
      ...results.users.map((i) => ({ ...i, category: "user" })),
    ];
  }, [results]);

  const handleNavigation = (item) => {
    if (!item) return;

    if (item.type === "action") {
      navigate(item.path, { state: { action: item.actionCode } });
    } else if (item.type === "setting") {
      navigate(item.path, { state: { tab: item.tab } });
    } else if (item.category === "page") {
      navigate(item.path);
    } else if (item.category === "transaction") {
      navigate("/admin/transactions", {
        state: { openTransactionId: item.id },
      });
    } else if (item.category === "user") {
      navigate("/admin/users", { state: { searchQuery: item.name } });
    }
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % flatResults.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(
            (prev) => (prev - 1 + flatResults.length) % flatResults.length
          );
          break;
        case "Enter":
          e.preventDefault();
          if (flatResults[selectedIndex]) {
            handleNavigation(flatResults[selectedIndex]);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, flatResults, selectedIndex]);

  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/30 backdrop-blur-xl transition-all"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl overflow-hidden flex flex-col max-h-[70vh] shadow-xl bg-white/95 backdrop-blur-2xl border border-gray-200/60"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 gap-3 border-b border-gray-200/60">
          <SearchIcon className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 text-base outline-none text-gray-900 placeholder-gray-400 bg-transparent"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="hidden sm:flex items-center bg-gray-100 px-2 py-1 rounded text-xs text-gray-500 font-medium">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-1.5" ref={listRef}>
          {flatResults.map((item, index) => {
            const isSelected = index === selectedIndex;
            let icon, title, subtitle;

            if (item.category === "action") {
              icon = item.icon;
              title = item.name;
              subtitle = item.type === "setting" ? "Settings" : "Quick Action";
            } else if (item.category === "page") {
              icon = <div className="text-gray-500">{item.icon}</div>;
              title = item.name;
              subtitle = "Navigate";
            } else if (item.category === "transaction") {
              icon = <DocumentTextIcon className="w-5 h-5 text-orange-500" />;
              title = `Voucher: ${item.voucherId || "N/A"}`;
              subtitle = `${item.transactionId} • ${item.amount}`;
            } else {
              icon = <UserCircleIcon className="w-5 h-5 text-emerald-600" />;
              title = item.name;
              subtitle = `${item.email} • ${item.role}`;
            }

            return (
              <div
                key={`${item.category}-${item.id || item.path || item.name}`}
                onClick={() => handleNavigation(item)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  isSelected ? "bg-emerald-50" : "hover:bg-gray-50"
                }`}
              >
                <div className="p-1.5 rounded-md bg-white shadow-sm border border-gray-100">
                  {icon}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-medium text-gray-900 text-sm truncate">
                    {title}
                  </span>
                  <span className="text-xs text-gray-500 truncate">
                    {subtitle}
                  </span>
                </div>
                {isSelected && (
                  <kbd className="bg-emerald-100 px-1.5 py-0.5 rounded text-xs font-medium text-emerald-700">
                    ↵
                  </kbd>
                )}
              </div>
            );
          })}

          {query && flatResults.length === 0 && (
            <div className="py-12 text-center">
              <SearchIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No results</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 bg-gray-50/80 border-t border-gray-200/60 flex items-center justify-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <kbd className="bg-white px-1.5 py-0.5 rounded border border-gray-200">
              ↑↓
            </kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-white px-1.5 py-0.5 rounded border border-gray-200">
              ↵
            </kbd>
            Select
          </span>
        </div>
      </div>
    </div>
  );
}
