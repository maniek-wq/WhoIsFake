import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { ToastContainer, type Toast } from "../components/ui/ToastNotification";

type ToastType = Toast["type"];

interface ToastCtx {
  addToast: (type: ToastType, message: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

let counter = 0;
const uid = () => `t-${++counter}-${Date.now()}`;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    setToasts((prev) => [...prev, { id: uid(), type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <Ctx.Provider value={{ addToast }}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {children}
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

/** Map server toast kinds to the UI toast types. */
export function toastTypeFromKind(kind: "info" | "success" | "warn" | "error"): ToastType {
  return kind === "warn" ? "warning" : kind;
}
