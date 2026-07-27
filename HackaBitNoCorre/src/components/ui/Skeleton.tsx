export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-[var(--color-surface-2)] rounded-[var(--radius-md)] animate-pulse ${className}`}
      aria-hidden
    />
  );
}
