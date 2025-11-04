import "./App.css";
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./component/user/Layout";
import Dashboard from "./pages/user/Dashboard";
import Report from "./pages/user/Report";
import Statement from "./pages/user/Statement";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected (nested) Routes */}
          <Route path="/home" element={<Layout />}>
            <Route index element={<Dashboard />} /> {/* /home */}
            <Route path="dashboard" element={<Dashboard />} />{" "}
            {/* /home/dashboard */}
            <Route path="report" element={<Report />} /> {/* /home/report */}
            <Route path="statement" element={<Statement />} />{" "}
            {/* /home/statement */}
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
