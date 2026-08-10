import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { installCsrf } from "./lib/csrf";
import { API_BASE } from "./lib/apiClient";

installCsrf(API_BASE);

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Application root element is missing");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
