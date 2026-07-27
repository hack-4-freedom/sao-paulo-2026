import { SAT, formatAmount, formatBipPlus } from "@/lib/format";

type SatsBadgeProps = {
  amount: number;
  className?: string;
  showPlus?: boolean;
  variant?: "pill" | "plain";
};

/**
 * BIP-177 compliant badge. Displays ₿21 instead of "21 sats".
 */
export function SatsBadge({
  amount,
  className = "",
  showPlus = false,
  variant = "pill",
}: SatsBadgeProps) {
  if (variant === "plain") {
    return (
      <span className={`inline-flex items-baseline gap-0.5 font-semibold ${className}`}>
        <span aria-hidden className="text-[var(--color-primary)]">{SAT}</span>
        <span>{formatAmount(amount)}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-baseline gap-0.5 bg-[var(--color-primary-soft)] text-[var(--color-primary)] rounded-full px-3 py-1 text-sm font-semibold ${className}`}
    >
      {showPlus && amount > 0 ? (
        <>
          <span aria-hidden>{SAT}</span>
          <span>{formatBipPlus(amount).slice(1)}</span>
        </>
      ) : (
        <>
          <span aria-hidden>{SAT}</span>
          <span>{formatAmount(amount)}</span>
        </>
      )}
    </span>
  );
}
