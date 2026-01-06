import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";

import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { FinanceProvider } from "./context/FinanceContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/* ------------------------------------------------------------------
   Service Worker registration (enabled in production)
   Provides update notifications via 'sw-update-available' event
------------------------------------------------------------------- */
if (import.meta.env.MODE === "production" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js", { scope: "/" })
      .then((registration) => {
        const notifyUpdate = () => window.dispatchEvent(new Event("sw-update-available"));

        // If there's already a waiting worker, prompt immediately
        if (registration.waiting) notifyUpdate();

        // Watch for new versions installing
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              notifyUpdate();
            }
          });
        });

        // Periodically check for updates (hourly)
        setInterval(() => registration.update(), 60 * 60 * 1000);
      })
      .catch((err) => {
        console.warn("Service worker registration failed:", err);
      });
  });

  // Auto-reload when a new worker takes control after skipWaiting
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 2 * 60 * 1000, // 2 minutes default
      gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime in v4)
      networkMode: 'always', // Don't wait for network status
    },
  },
});

root.render(
  <AuthProvider>
    <FinanceProvider>
      <QueryClientProvider client={queryClient}>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <App />
        </Router>
      </QueryClientProvider>
    </FinanceProvider>
  </AuthProvider>
);


const preload = document.getElementById("preload-spinner");
if (preload) {
  preload.remove();
}