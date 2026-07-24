import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type ButtonProps = Omit<HTMLMotionProps<"button">, "ref"> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--color-primary)] text-[var(--color-primary-fg)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-press)] shadow-[var(--shadow-md)] font-semibold",
  secondary:
    "bg-[var(--color-surface-2)] text-[var(--color-fg)] hover:bg-[var(--color-surface-3)] border border-[var(--color-border)] font-medium",
  ghost:
    "bg-transparent text-[var(--color-fg-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-fg)] font-medium",
  danger:
    "bg-[var(--color-error-soft)] text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white font-semibold",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-sm rounded-[var(--radius-md)]",
  md: "h-12 px-5 text-base rounded-[var(--radius-lg)]",
  lg: "h-14 px-6 text-lg rounded-[var(--radius-lg)]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      disabled,
      children,
      className = "",
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    return (
      <motion.button
        ref={ref}
        whileTap={isDisabled ? undefined : { scale: 0.97 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center gap-2 select-none transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-soft)] disabled:opacity-50 disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
        {...rest}
      >
        {loading ? (
          <span
            className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"
            aria-hidden
          />
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
