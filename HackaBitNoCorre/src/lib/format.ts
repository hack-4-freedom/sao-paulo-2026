/**
 * BIP-177 formatting utilities.
 * Display convention: ₿21 (symbol + amount, no "sats" word).
 * The ₿ symbol precedes the number, space-separated.
 */

const SAT_SYMBOL = "\u20BF";

/** Format a satoshi amount as BIP-177: ₿21 */
export function formatBip(amount: number): string {
  return `${SAT_SYMBOL}${amount.toLocaleString("pt-BR")}`;
}

/** Format with a + prefix for rewards: +₿21 */
export function formatBipPlus(amount: number): string {
  return `+${SAT_SYMBOL}${amount.toLocaleString("pt-BR")}`;
}

/** Just the symbol */
export const SAT = SAT_SYMBOL;

/** Format a satoshi amount as a plain localized number (for contexts where ₿ is shown separately) */
export function formatAmount(amount: number): string {
  return amount.toLocaleString("pt-BR");
}
