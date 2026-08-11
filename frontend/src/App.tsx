import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Forgot from "./pages/Forgot";
import Layout from "./component/user/Layout";
import Dashboard from "./pages/user/Dashboard";
import Report from "./pages/user/Report";
import Statement from "./pages/user/Statement";
import Settings from "./pages/user/Settings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UserPackages from "./pages/user/Packages";
import UserMyApplications from "./pages/user/UserMyApplications";
import SuperadminLayout from "./component/superadmin/Layout";
import SuperadminDashboard from "./pages/superadmin/Dashboard";
import Analytics from "./pages/superadmin/Analytics";
import History from "./pages/superadmin/History";
import Networks from "./pages/superadmin/Networks";
import SuperLogin from "./pages/SuperLogin";
import SuperadminProtectedRoute from "./component/superadmin/ProtectedRoute";
import AdminLayout from "./component/admin/Layout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminHistory from "./pages/admin/History";
import AdminTransactions from "./pages/admin/Transactions";
import AdminPackages from "./pages/admin/Packages";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminSettings from "./pages/admin/Settings";
import Landing from "./pages/Landing2";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/home" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="report" element={<Report />} />
          <Route path="statement" element={<Statement />} />
          <Route path="settings" element={<Settings />} />
          <Route path="packages" element={<UserPackages />} />
          <Route path="applications" element={<UserMyApplications />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="packages" element={<AdminPackages />} />
          <Route path="applications" element={<AdminApplications />} />
          <Route path="history" element={<AdminHistory />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        <Route path="/super-login" element={<SuperLogin />} />
        <Route path="/superadmin" element={<SuperadminProtectedRoute><SuperadminLayout /></SuperadminProtectedRoute>}>
          <Route index element={<SuperadminDashboard />} />
          <Route path="dashboard" element={<SuperadminDashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="history" element={<History />} />
          <Route path="networks" element={<Networks />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
