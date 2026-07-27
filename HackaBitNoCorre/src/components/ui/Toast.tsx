import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; message: string };

type ToastCtx = { push: (kind: ToastKind, message: string) => void };

const Ctx = createContext<ToastCtx | null>(null);

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const icons: Record<ToastKind, ReactNode> = {
  success: <CheckCircle2 size={20} className="text-[var(--color-success)]" />,
  error: <AlertCircle size={20} className="text-[var(--color-error)]" />,
  info: <Info size={20} className="text-[var(--color-info)]" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3200);
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-[calc(env(safe-area-inset-top)+12px)] pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
              className="pointer-events-auto max-w-sm w-full flex items-center gap-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border-strong)] rounded-[var(--radius-md)] px-4 py-3 shadow-[var(--shadow-lg)]"
            >
              {icons[t.kind]}
              <span className="text-sm text-[var(--color-fg)] flex-1">
                {t.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
