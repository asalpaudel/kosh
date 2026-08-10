import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

function pageName(pathname: string): string {
  const name = pathname.split("/").filter(Boolean).at(-1) ?? "home";
  return name === "home" ? "Dashboard" : `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

export default function Layout() {
  const location = useLocation();
  return (
    <div className="bg-black flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header pageName={pageName(location.pathname)} />
        <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto">
          <main className="flex-1 p-4 md:p-6 lg:p-8"><Outlet /></main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
