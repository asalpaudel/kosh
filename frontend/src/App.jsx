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
import UserPackages from "./pages/user/Packages.jsx";
import ApplyPackageForm from "./component/user/ApplyPackageForm.jsx";

// SUPERADMIN IMPORTS
import SuperadminLayout from "./component/superadmin/Layout.jsx";
import SuperadminDashboard from "./pages/superadmin/Dashboard.jsx";
import Analytics from "./pages/superadmin/Analytics.jsx";
import History from "./pages/superadmin/History.jsx";
import Networks from "./pages/superadmin/Networks.jsx";

// --- ADMIN IMPORTS ---
import AdminLayout from "./component/admin/Layout.jsx";
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import AdminUsers from "./pages/admin/Users.jsx";
import AdminHistory from "./pages/admin/History.jsx";
import AdminTransactions from "./pages/admin/Transactions.jsx";
import AdminPackages from "./pages/admin/Packages.jsx";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* User Routes */}
          <Route path="/home" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="report" element={<Report />} />
            <Route path="statement" element={<Statement />} />
            <Route path="packages" element={<UserPackages />} />
            <Route
              path="packages/apply/:type/:id"
              element={<ApplyPackageForm />}
            />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="packages" element={<AdminPackages />} />
            <Route path="history" element={<AdminHistory />} />
            <Route path="transactions" element={<AdminTransactions />} />
          </Route>

          {/* Superadmin Routes */}
          <Route path="/superadmin" element={<SuperadminLayout />}>
            <Route index element={<SuperadminDashboard />} />
            <Route path="dashboard" element={<SuperadminDashboard />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="history" element={<History />} />
            <Route path="networks" element={<Networks />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;