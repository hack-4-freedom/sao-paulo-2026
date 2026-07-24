import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  leftSlot?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftSlot, className = "", id, ...rest }, ref) => {
    const inputId = id || rest.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-fg-muted)]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftSlot && (
            <span className="absolute left-4 text-[var(--color-fg-subtle)] pointer-events-none">
              {leftSlot}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full h-12 bg-[var(--color-surface)] border ${
              error ? "border-[var(--color-error)]" : "border-[var(--color-border)]"
            } rounded-[var(--radius-md)] px-4 text-base text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-primary)] transition-colors duration-[var(--duration-fast)] ${
              leftSlot ? "pl-11" : ""
            } ${className}`}
            {...rest}
          />
        </div>
        {error ? (
          <p className="text-sm text-[var(--color-error)]">{error}</p>
        ) : hint ? (
          <p className="text-sm text-[var(--color-fg-subtle)]">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
