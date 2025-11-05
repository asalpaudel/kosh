import "./App.css";
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

// User Components
import Layout from "./component/user/Layout"; //
import Dashboard from "./pages/user/Dashboard"; //
import Report from "./pages/user/Report"; //
import Statement from "./pages/user/Statement"; //

// Public Components
import Login from "./pages/Login"; //
import Signup from "./pages/Signup"; //

// Superadmin Components
import SuperadminLayout from "./component/superadmin/Layout"; //
import SuperadminDashboard from "./pages/superadmin/Dashboard"; //

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected (user) Routes */}
          <Route path="/home" element={<Layout />}>
            <Route index element={<Dashboard />} /> {/* /home */}
            <Route path="dashboard" element={<Dashboard />} />{" "}
            {/* /home/dashboard */}
            <Route path="report" element={<Report />} /> {/* /home/report */}
            <Route path="statement" element={<Statement />} />{" "}
            {/* /home/statement */}
          </Route>

          {/* NEW: Protected (superadmin) Routes */}
          <Route path="/superadmin" element={<SuperadminLayout />}>
            <Route index element={<SuperadminDashboard />} /> {/* /superadmin */}
            <Route path="dashboard" element={<SuperadminDashboard />} />{" "}
            {/* /superadmin/dashboard */}
            {/* You can add more superadmin-specific routes here later */}
          </Route>
          
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;