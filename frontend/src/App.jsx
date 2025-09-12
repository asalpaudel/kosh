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
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="report" element={<Report />} />
            <Route path="statement" element={<Statement />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;