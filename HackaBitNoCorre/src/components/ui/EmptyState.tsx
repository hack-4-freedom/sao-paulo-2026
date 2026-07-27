import type { ReactNode } from "react";

type EmptyStateProps = {
  emoji?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({
  emoji = "✨",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="text-5xl mb-4" aria-hidden>
        {emoji}
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-fg)] mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--color-fg-muted)] max-w-xs mb-6">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
