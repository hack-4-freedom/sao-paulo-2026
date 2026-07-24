import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BottomNav } from "@/components/ui/BottomNav";

export function AppShell() {
  const location = useLocation();
  const hideNav = location.pathname.startsWith("/app/licao/");

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)] safe-top">
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className={`max-w-md mx-auto min-h-[100dvh] ${hideNav ? "" : "pb-20"}`}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      {!hideNav && <BottomNav />}
    </div>
  );
}
