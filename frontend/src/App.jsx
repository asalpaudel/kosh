import "./App.css";
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import Layout from "./component/user/Layout";
import Dashboard from "./component/user/Dashboard";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="/userdashboard" element={<Dashboard />}></Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
