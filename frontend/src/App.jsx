import "./App.css";
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

// User Imports
import Layout from "./component/user/Layout.jsx";
import Dashboard from "./pages/user/Dashboard.jsx";
import Report from "./pages/user/Report.jsx";
import Statement from "./pages/user/Statement.jsx";
import Login from "./pages/Login.jsx"; 
import Signup from "./pages/Signup.jsx";

// SUPERADMIN IMPORTS
import SuperadminLayout from "./component/superadmin/Layout.jsx";
import SuperadminDashboard from "./pages/superadmin/Dashboard.jsx";
import Analytics from "./pages/superadmin/Analytics.jsx";
import History from "./pages/superadmin/History.jsx"; 

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected (nested) User Routes */}
          <Route path="/home" element={<Layout />}>
            <Route index element={<Dashboard />} /> 
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="report" element={<Report />} />
            <Route path="statement" element={<Statement />} />
          </Route>

          {/* Protected (nested) Superadmin Routes */}
          <Route path="/superadmin" element={<SuperadminLayout />}>
            <Route index element={<SuperadminDashboard />} /> 
            <Route path="dashboard" element={<SuperadminDashboard />} />
            <Route path="analytics" element={<Analytics />} />
            
            {/* The History route linked in the Sidebar.jsx */}
            <Route path="history" element={<History />} />
          </Route>
          
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;