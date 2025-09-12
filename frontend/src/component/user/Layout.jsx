import { Outlet, useLocation } from "react-router-dom";
import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

function Layout() {
  const location = useLocation();
  const getPageName = (pathname) => {
    if (pathname === "/") return "Dashboard";
    const name = pathname.split("/").pop();
    return name.charAt(0).toUpperCase() + name.slice(1);
  };
  const pageName = getPageName(location.pathname);

  return (
    <div className="bg-black flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header pageName={pageName} />
        <div className="flex-1 flex flex-col bg-white rounded-tl-3xl rounded-bl-3xl overflow-y-auto">
          <main className="flex-1 p-6">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default Layout;