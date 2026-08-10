import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../lib/apiClient";
import { stringField } from "../../lib/validation";
import { SearchIcon, SettingsIcon } from "../icons";
import GlobalSearch from "./GlobalSearch";

export default function Header({ pageName }: { pageName: string }) {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const response = await fetch(`${API_BASE}/session`, { credentials: "include" });
        const body: unknown = response.ok ? await response.json() : null;
        setUserName(stringField(body, "userName") ?? "Admin");
      } catch {
        setUserName("Admin");
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setIsSearchOpen((previous) => !previous);
      } else if (event.key === "Escape") setIsSearchOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => { window.removeEventListener("keydown", handleKeyDown); };
  }, []);

  return (
    <>
      <header className="bg-black h-16 md:h-20 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
        <h1 className="text-white font-semibold text-lg md:text-2xl">{pageName}</h1>
        <div className="flex items-center gap-2 md:gap-6">
          <span className="text-gray-400 font-medium text-xs md:text-sm hidden lg:block">Hello, <span className="text-emerald-400">{userName || "..."}</span></span>
          <button type="button" onClick={() => { setIsSearchOpen(true); }} className="p-2 md:p-2.5 rounded-lg hover:bg-gray-900" title="Search (Ctrl+K)"><SearchIcon className="text-gray-400 h-5 w-5" /></button>
          <button type="button" onClick={() => { void navigate("/admin/settings"); }} className="p-2 md:p-2.5 rounded-lg hover:bg-gray-900"><SettingsIcon className="text-gray-400 h-5 w-5" /></button>
        </div>
      </header>
      <GlobalSearch isOpen={isSearchOpen} onClose={() => { setIsSearchOpen(false); }} />
    </>
  );
}
