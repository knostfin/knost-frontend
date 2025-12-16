import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";

import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { FinanceProvider } from "./context/FinanceContext";

/* ------------------------------------------------------------------
   Service Worker (DISABLED by default)
   Netlify already provides CDN caching
------------------------------------------------------------------- */
// Uncomment ONLY if you really implement PWA correctly
/*
if (import.meta.env.MODE === "production" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .catch((err) => {
        console.warn("Service worker registration failed:", err);
      });
  });
}
*/

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  import.meta.env.MODE === "development" ? (
    <React.StrictMode>
      <AuthProvider>
        <FinanceProvider>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <App />
          </Router>
        </FinanceProvider>
      </AuthProvider>
    </React.StrictMode>
  ) : (
    <AuthProvider>
      <FinanceProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <App />
        </Router>
      </FinanceProvider>
    </AuthProvider>
  )
);


const preload = document.getElementById("preload-spinner");
if (preload) {
  preload.remove();
}