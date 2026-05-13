import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { applyTheme, getStoredTheme } from "./lib/themes";

// Apply persisted theme before React mounts to prevent a flash.
applyTheme(getStoredTheme());

// Register the service worker for PWA / offline shell.
// We only register in production builds — Vite's dev server does not serve
// the same static asset surface, and a stale SW would interfere with HMR.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // non-fatal; site works without offline support
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
