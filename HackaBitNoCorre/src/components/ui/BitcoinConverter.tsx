import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SAT, formatAmount } from "@/lib/format";
import { satsToBrl, satsToUsd, brlToSats, usdToSats } from "@/lib/market";
import type { BitcoinPrice } from "@/lib/market";

type Unit = "BTC" | "BRL" | "USD";

type BitcoinConverterProps = {
  price: BitcoinPrice;
};

export function BitcoinConverter({ price }: BitcoinConverterProps) {
  const [fromUnit, setFromUnit] = useState<Unit>("BTC");
  const [toUnit, setToUnit] = useState<Unit>("BRL");
  const [input, setInput] = useState("250");

  const btcFromSats = (sats: number) => sats / 100_000_000;

  function convert(value: number, from: Unit, to: Unit): number {
    let sats: number;
    switch (from) {
      case "BTC": sats = value * 100_000_000; break;
      case "BRL": sats = brlToSats(value, price.brl); break;
      case "USD": sats = usdToSats(value, price.usd); break;
    }
    switch (to) {
      case "BTC": return btcFromSats(sats);
      case "BRL": return satsToBrl(sats, price.brl);
      case "USD": return satsToUsd(sats, price.usd);
    }
  }

  const inputValue = parseFloat(input) || 0;
  const result = convert(inputValue, fromUnit, toUnit);

  const formatResult = (val: number, unit: Unit): string => {
    if (unit === "BTC") {
      const sats = Math.round(val * 100_000_000);
      return `${SAT}${formatAmount(sats)}`;
    }
    return val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const swap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const unitSymbol: Record<Unit, string> = { BTC: SAT, BRL: "R$", USD: "$" };

  return (
    <div className="flex flex-col gap-3">
      {/* From */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--color-fg-subtle)]">De</label>
        <div className="flex gap-2">
          <select
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value as Unit)}
            className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-[var(--color-fg)] focus:outline-none focus:border-[var(--color-primary)]"
          >
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="BRL">Real (BRL)</option>
            <option value="USD">Dólar (USD)</option>
          </select>
          <input
            type="number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="0"
            className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-4 py-2.5 text-base font-semibold text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-primary)] tabular-nums"
          />
        </div>
      </div>

      {/* Swap button */}
      <div className="flex justify-center">
        <Button variant="ghost" size="sm" onClick={swap}>
          <ArrowLeftRight size={16} />
        </Button>
      </div>

      {/* To */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--color-fg-subtle)]">Para</label>
        <div className="flex gap-2">
          <select
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value as Unit)}
            className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-[var(--color-fg)] focus:outline-none focus:border-[var(--color-primary)]"
          >
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="BRL">Real (BRL)</option>
            <option value="USD">Dólar (USD)</option>
          </select>
          <div className="flex-1 bg-[var(--color-primary-soft)] border border-[var(--color-primary)]/20 rounded-[var(--radius-md)] px-4 py-2.5 text-base font-bold text-[var(--color-primary)] tabular-nums flex items-center">
            {unitSymbol[toUnit] === SAT ? "" : unitSymbol[toUnit] + " "}
            {formatResult(result, toUnit)}
          </div>
        </div>
      </div>
    </div>
  );
}
