import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from 'react-router-dom';
import { API_BASE, apiFetch } from "../../lib/apiClient";
import { parseTransactions, type TransactionRecord } from "../../lib/transactions";
import { 
  SearchIcon, 
  LayoutDashboardIcon, 
  FileTextIcon, 
  PiggyBankIcon, 
  SettingsIcon,
  BarChartIcon,
  DocumentTextIcon
} from '../icons';


interface SearchLink {
  name: string;
  path: string;
  icon: ReactNode;
}

type SearchResult =
  | (SearchLink & { category: "action" })
  | (SearchLink & { category: "page" })
  | (TransactionRecord & { category: "transaction" });

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ pages: SearchLink[]; transactions: TransactionRecord[]; actions: SearchLink[] }>({ pages: [], transactions: [], actions: [] });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const pages = useMemo<SearchLink[]>(() => [
    { name: "Dashboard", path: "/home/dashboard", icon: <LayoutDashboardIcon className="w-5 h-5" /> },
    { name: "Financial Report", path: "/home/report", icon: <BarChartIcon className="w-5 h-5" /> },
    { name: "Account Statement", path: "/home/statement", icon: <FileTextIcon className="w-5 h-5" /> },
    { name: "Our Packages", path: "/home/packages", icon: <PiggyBankIcon className="w-5 h-5" /> },
    { name: "Settings", path: "/home/settings", icon: <SettingsIcon className="w-5 h-5" /> },
  ], []);

  const staticActions = useMemo<SearchLink[]>(() => [
    { name: "Change Password", path: "/home/settings", icon: <SettingsIcon className="w-5 h-5 text-gray-500" /> },
    { name: "View Transactions", path: "/home/statement", icon: <FileTextIcon className="w-5 h-5 text-blue-500" /> },
    { name: "Apply for Loan", path: "/home/packages", icon: <PiggyBankIcon className="w-5 h-5 text-teal-500" /> },
  ], []);

  useEffect(() => {
    const input = inputRef.current;
    if (isOpen && input) setTimeout(() => { input.focus(); }, 50);
    if (!isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!query) {
        setResults({ pages: [], transactions: [], actions: [] });
        return;
      }

      const lowerQuery = query.toLowerCase();
      const matchingPages = pages.filter(p => p.name.toLowerCase().includes(lowerQuery));
      const matchingActions = staticActions.filter(a => a.name.toLowerCase().includes(lowerQuery));

      let matchingTransactions: TransactionRecord[] = [];
      try {
        const txnRes = await apiFetch(`${API_BASE}/transactions`);
        matchingTransactions = parseTransactions(await txnRes.json())
          .filter((transaction) =>
            transaction.id.toLowerCase().includes(lowerQuery) ||
            transaction.voucherId.toLowerCase().includes(lowerQuery) ||
            transaction.type.toLowerCase().includes(lowerQuery) ||
            String(transaction.amount).includes(lowerQuery)
          ).slice(0, 3);
      } catch {
        matchingTransactions = [];
      }

      setResults({ 
          pages: matchingPages, 
          transactions: matchingTransactions, 
          actions: matchingActions 
      });
      setSelectedIndex(0);
    }, 300);

    return () => { clearTimeout(delayDebounceFn); };
  }, [pages, query, staticActions]);

  const flatResults = useMemo<SearchResult[]>(() => {
    return [
      ...results.actions.map(i => ({ ...i, category: "action" as const })),
      ...results.pages.map(i => ({ ...i, category: "page" as const })),
      ...results.transactions.map(i => ({ ...i, category: "transaction" as const }))
    ];
  }, [results]);

  const handleNavigation = useCallback((item: SearchResult | undefined) => {
    if (!item) return;
    
    if (item.category === 'transaction') {
      void navigate("/home/statement", { state: { highlightTransactionId: item.id } });
    } else {
      void navigate(item.path);
    }
    onClose();
  }, [navigate, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (flatResults.length > 0) setSelectedIndex(prev => (prev + 1) % flatResults.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (flatResults.length > 0) setSelectedIndex(prev => (prev - 1 + flatResults.length) % flatResults.length);
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
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [handleNavigation, isOpen, flatResults, selectedIndex]);

  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children.item(selectedIndex);
      if (selectedElement instanceof HTMLElement) {
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
        onMouseDown={(e) => { e.stopPropagation(); }}
      >
        <div className="flex items-center border-b border-gray-200 p-4 gap-3">
          <SearchIcon className="w-6 h-6 text-teal-500" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 text-xl outline-none text-gray-700 placeholder-gray-400 bg-transparent"
            placeholder="Search pages, transactions, or actions..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); }}
          />
          <kbd className="hidden sm:block bg-gray-100 px-2 py-1 rounded text-xs text-gray-500 font-mono">ESC</kbd>
        </div>

        <div className="overflow-y-auto p-2 space-y-1" ref={listRef}>
          {flatResults.map((item, index) => {
            const isSelected = index === selectedIndex;
            let icon: ReactNode;
            let title = "Search result";
            let subtitle = "";

            if (item.category === 'action') {
              icon = item.icon;
              title = item.name;
              subtitle = "Quick Action";
            } else if (item.category === 'page') {
              icon = <div className="text-gray-500">{item.icon}</div>;
              title = item.name;
              subtitle = "Navigation";
            } else {
              icon = <DocumentTextIcon className="w-5 h-5 text-orange-500" />;
              title = `Voucher: ${item.voucherId || "N/A"}`;
              subtitle = `${item.type} • Rs. ${item.amount.toLocaleString()}`;
            }

            return (
              <div 
                key={item.category === "transaction" ? `transaction-${item.id}` : `${item.category}-${item.path}`}
                onClick={() => { handleNavigation(item); }}
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
