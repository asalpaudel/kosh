import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE, apiFetch } from "../../lib/apiClient";
import { parseTransactions, type TransactionRecord } from "../../lib/transactions";
import { parseManagedUsers, type ManagedUser } from "../../lib/users";
import {
  SearchIcon, UserCircleIcon, LayoutDashboardIcon, FileTextIcon, UsersIcon,
  PiggyBankIcon, SettingsIcon, PlusCircleIcon, DocumentTextIcon, ShieldIcon,
  BanknotesIcon, DocumentIcon, CurrencyDollarIcon,
} from "../icons";

interface SearchLink { name: string; path: string; icon: ReactNode }
interface SearchAction extends SearchLink { type: "action" | "setting"; actionCode?: string; tab?: string }
type SearchResult =
  | (SearchAction & { category: "action" })
  | (SearchLink & { category: "page" })
  | (TransactionRecord & { category: "transaction" })
  | (ManagedUser & { category: "user" });

const PAGES: SearchLink[] = [
  { name: "Dashboard", path: "/admin/dashboard", icon: <LayoutDashboardIcon className="w-5 h-5" /> },
  { name: "Manage Users", path: "/admin/users", icon: <UsersIcon className="w-5 h-5" /> },
  { name: "Transactions", path: "/admin/transactions", icon: <FileTextIcon className="w-5 h-5" /> },
  { name: "Packages", path: "/admin/packages", icon: <PiggyBankIcon className="w-5 h-5" /> },
  { name: "Applications", path: "/admin/applications", icon: <DocumentTextIcon className="w-5 h-5" /> },
  { name: "Settings", path: "/admin/settings", icon: <SettingsIcon className="w-5 h-5" /> },
];
const ACTIONS: SearchAction[] = [
  { name: "Add User", type: "action", actionCode: "openAddUser", path: "/admin/users", icon: <PlusCircleIcon className="w-5 h-5 text-emerald-600" /> },
  { name: "Add Transaction", type: "action", actionCode: "openAddTxn", path: "/admin/transactions", icon: <PlusCircleIcon className="w-5 h-5 text-blue-600" /> },
  { name: "Add Fixed Deposit Package", type: "action", actionCode: "openAddFD", path: "/admin/packages", icon: <DocumentIcon className="w-5 h-5 text-cyan-600" /> },
  { name: "Add Saving Account Package", type: "action", actionCode: "openAddSaving", path: "/admin/packages", icon: <CurrencyDollarIcon className="w-5 h-5 text-cyan-600" /> },
  { name: "Add Loan Package", type: "action", actionCode: "openAddLoan", path: "/admin/packages", icon: <BanknotesIcon className="w-5 h-5 text-cyan-600" /> },
  { name: "Profile Settings", type: "setting", tab: "Profile", path: "/admin/settings", icon: <UserCircleIcon className="w-5 h-5 text-gray-600" /> },
  { name: "Security Settings", type: "setting", tab: "Security", path: "/admin/settings", icon: <ShieldIcon className="w-5 h-5 text-gray-600" /> },
];

export default function GlobalSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ pages: SearchLink[]; users: ManagedUser[]; transactions: TransactionRecord[]; actions: SearchAction[] }>({ pages: [], users: [], transactions: [], actions: [] });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const input = inputRef.current;
    if (isOpen && input) setTimeout(() => { input.focus(); }, 50);
    if (!isOpen) { setQuery(""); setSelectedIndex(0); }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const search = async () => {
        if (!query.trim()) { setResults({ pages: [], users: [], transactions: [], actions: [] }); return; }
        const lowerQuery = query.toLowerCase();
        try {
          const [usersResponse, transactionsResponse] = await Promise.all([
            apiFetch(`${API_BASE}/users`), apiFetch(`${API_BASE}/transactions`),
          ]);
          const users = parseManagedUsers(await usersResponse.json()).filter((user) => user.name.toLowerCase().includes(lowerQuery) || user.email.toLowerCase().includes(lowerQuery)).slice(0, 3);
          const transactions = parseTransactions(await transactionsResponse.json()).filter((transaction) => transaction.id.toLowerCase().includes(lowerQuery) || transaction.voucherId.toLowerCase().includes(lowerQuery)).slice(0, 3);
          setResults({
            pages: PAGES.filter((page) => page.name.toLowerCase().includes(lowerQuery)),
            actions: ACTIONS.filter((action) => action.name.toLowerCase().includes(lowerQuery)),
            users, transactions,
          });
        } catch {
          setResults({ pages: [], users: [], transactions: [], actions: [] });
        }
        setSelectedIndex(0);
      };
      void search();
    }, 300);
    return () => { clearTimeout(timer); };
  }, [query]);

  const flatResults = useMemo<SearchResult[]>(() => [
    ...results.actions.map((item) => ({ ...item, category: "action" as const })),
    ...results.pages.map((item) => ({ ...item, category: "page" as const })),
    ...results.transactions.map((item) => ({ ...item, category: "transaction" as const })),
    ...results.users.map((item) => ({ ...item, category: "user" as const })),
  ], [results]);

  const handleNavigation = useCallback((item: SearchResult | undefined) => {
    if (!item) return;
    if (item.category === "action") {
      void navigate(item.path, { state: item.type === "setting" ? { tab: item.tab } : { action: item.actionCode } });
    } else if (item.category === "page") void navigate(item.path);
    else if (item.category === "transaction") void navigate("/admin/transactions", { state: { openTransactionId: item.id } });
    else void navigate("/admin/users", { state: { searchQuery: item.name } });
    onClose();
  }, [navigate, onClose]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen || flatResults.length === 0) return;
      if (event.key === "ArrowDown") { event.preventDefault(); setSelectedIndex((index) => (index + 1) % flatResults.length); }
      else if (event.key === "ArrowUp") { event.preventDefault(); setSelectedIndex((index) => (index - 1 + flatResults.length) % flatResults.length); }
      else if (event.key === "Enter") { event.preventDefault(); handleNavigation(flatResults[selectedIndex]); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => { window.removeEventListener("keydown", handleKeyDown); };
  }, [flatResults, handleNavigation, isOpen, selectedIndex]);

  useEffect(() => {
    const selected = listRef.current?.children.item(selectedIndex);
    if (selected instanceof HTMLElement) selected.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/30 backdrop-blur-xl" onMouseDown={onClose}>
      <div className="w-full max-w-2xl rounded-xl overflow-hidden flex flex-col max-h-[70vh] shadow-xl bg-white/95 border" onMouseDown={(event) => { event.stopPropagation(); }}>
        <div className="flex items-center px-4 py-3 gap-3 border-b"><SearchIcon className="w-5 h-5 text-gray-400" /><input ref={inputRef} className="flex-1 outline-none bg-transparent" placeholder="Search..." value={query} onChange={(event) => { setQuery(event.target.value); }} /></div>
        <div className="overflow-y-auto p-1.5" ref={listRef}>
          {flatResults.map((item, index) => {
            const selected = index === selectedIndex;
            const icon = item.category === "action" || item.category === "page" ? item.icon : item.category === "transaction" ? <DocumentTextIcon className="w-5 h-5 text-orange-500" /> : <UserCircleIcon className="w-5 h-5 text-emerald-600" />;
            const title = item.category === "transaction" ? `Voucher: ${item.voucherId || "N/A"}` : item.name;
            const subtitle = item.category === "transaction" ? `${item.type} • Rs. ${item.amount.toLocaleString()}` : item.category === "user" ? `${item.email} • ${item.role}` : item.category === "page" ? "Navigate" : "Quick action";
            const key = item.category === "transaction" || item.category === "user" ? `${item.category}-${String(item.id)}` : `${item.category}-${item.path}-${item.name}`;
            return <button type="button" key={key} onClick={() => { handleNavigation(item); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${selected ? "bg-emerald-50" : "hover:bg-gray-50"}`}><span className="p-1.5 rounded-md bg-white border">{icon}</span><span className="flex flex-col min-w-0"><span className="font-medium text-sm truncate">{title}</span><span className="text-xs text-gray-500 truncate">{subtitle}</span></span></button>;
          })}
          {query && flatResults.length === 0 && <p className="py-12 text-center text-gray-400">No results</p>}
        </div>
      </div>
    </div>
  );
}
