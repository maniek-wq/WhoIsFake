import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { ToastProvider } from "./app/context/ToastContext";
import { AuthProvider } from "./app/context/AuthContext";
import { FriendsProvider } from "./app/context/FriendsContext";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <ToastProvider>
    <AuthProvider>
      <FriendsProvider>
        <App />
      </FriendsProvider>
    </AuthProvider>
  </ToastProvider>
);
