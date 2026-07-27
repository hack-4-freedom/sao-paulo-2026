import { motion } from "framer-motion";
import { Mascot } from "@/components/Mascot";

export function Splash() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[var(--color-bg)]">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="flex flex-col items-center gap-5"
      >
        <Mascot size={72} animated />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--color-fg)] tracking-tight">
            BIT NO CORRE
          </h1>
          <p className="text-sm text-[var(--color-fg-muted)] mt-1">
            Aprenda Bitcoin no dia a dia
          </p>
        </div>
      </motion.div>
    </div>
  );
}
