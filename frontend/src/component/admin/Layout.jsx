import { Outlet, useLocation } from "react-router-dom";
import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "../user/Footer";

function Layout() {
  const location = useLocation();
  const getPageName = (pathname) => {
    const name = pathname.split("/").pop();
    if (name === "admin") return "Dashboard";
    return name.charAt(0).toUpperCase() + name.slice(1);
  };
  const pageName = getPageName(location.pathname);

  return (
    <div className="bg-gray-50 flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header pageName={pageName} />
        <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto">
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default Layout;