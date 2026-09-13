import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { applyTheme, getStoredTheme } from "./lib/themes";
import { setupServiceWorker } from "./lib/pwa";

// Apply persisted theme before React mounts to prevent a flash.
applyTheme(getStoredTheme());

window.addEventListener("load", () => {
  void setupServiceWorker();
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
