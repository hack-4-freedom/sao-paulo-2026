import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

type CardProps = HTMLMotionProps<"div"> & {
  interactive?: boolean;
  children: ReactNode;
};

export function Card({
  interactive = false,
  children,
  className = "",
  ...rest
}: CardProps) {
  return (
    <motion.div
      whileTap={interactive ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
