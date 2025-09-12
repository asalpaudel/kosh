import { Outlet } from "react-router";
import React from "react";
import Header from "./Header";
import Sidebar from "../Sidebar";
import Footer from "./Footer";

function Layout({ children }) {
  return (
    <div className="flex flex-col h-screen bg-black">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 flex flex-col p-4">
          <Outlet />
          {children} {/* This is where the page-specific content will go */}
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default Layout;
