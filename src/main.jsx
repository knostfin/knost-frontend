import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";

import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

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

/* ------------------------------------------------------------------
   Render App
------------------------------------------------------------------- */
root.render(
  import.meta.env.MODE === "development" ? (
    <React.StrictMode>
      <AuthProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <App />
        </Router>
      </AuthProvider>
    </React.StrictMode>
  ) : (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
      </Router>
    </AuthProvider>
  )
);

/* ------------------------------------------------------------------
   Remove preload spinner after React mounts
------------------------------------------------------------------- */
const preload = document.getElementById("preload-spinner");
if (preload) {
  preload.remove();
}