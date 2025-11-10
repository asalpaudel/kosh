
import { Outlet, useLocation } from "react-router-dom";
import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "../user/Footer"; // Reusing the footer from user, matching your superadmin structure

function Layout() {
  const location = useLocation();
  const getPageName = (pathname) => {
    // Get the part after /admin/
    const name = pathname.split("/").pop();
    if (name === "admin") return "Dashboard";
    return name.charAt(0).toUpperCase() + name.slice(1);
  };
  const pageName = getPageName(location.pathname);

  return (
    <div className="bg-black flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header pageName={pageName} />
        <div className="flex-1 flex flex-col bg-white rounded-tl-3xl rounded-bl-3xl overflow-y-auto">
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default Layout;