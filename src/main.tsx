import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { LanguageProvider } from "./app/i18n/LanguageContext";
import { ToastProvider } from "./app/context/ToastContext";
import { AuthProvider } from "./app/context/AuthContext";
import { FriendsProvider } from "./app/context/FriendsContext";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <ToastProvider>
      <AuthProvider>
        <FriendsProvider>
          <App />
        </FriendsProvider>
      </AuthProvider>
    </ToastProvider>
  </LanguageProvider>
);

// Register the service worker for PWA installability (production builds only,
// so it never interferes with the dev server's hot-module reloading).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
