type ProgressProps = {
  value: number;
  max?: number;
  className?: string;
  color?: string;
};

export function Progress({
  value,
  max = 100,
  className = "",
  color = "var(--color-primary)",
}: ProgressProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={`w-full h-2 bg-[var(--color-surface-2)] rounded-full overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className="h-full rounded-full transition-[width] duration-[var(--duration-slow)] ease-[var(--ease-out-soft)]"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}
