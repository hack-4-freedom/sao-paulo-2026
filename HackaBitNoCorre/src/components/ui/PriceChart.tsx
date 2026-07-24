import { useMemo } from "react";
import type { PricePoint } from "@/lib/market";

type PriceChartProps = {
  prices: PricePoint[];
  height?: number;
  color?: string;
};

export function PriceChart({ prices, height = 160, color = "var(--color-primary)" }: PriceChartProps) {
  const { path, area, width } = useMemo(() => {
    if (prices.length < 2) return { path: "", area: "", minP: 0, maxP: 0, width: 0 };

    const w = 300;
    const h = height;
    const padding = 4;
    const min = Math.min(...prices.map((p) => p.price));
    const max = Math.max(...prices.map((p) => p.price));
    const range = max - min || 1;

    const points = prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * (w - padding * 2) + padding;
      const y = h - padding - ((p.price - min) / range) * (h - padding * 2);
      return { x, y };
    });

    const pathStr = points
      .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
      .join(" ");

    const areaStr = `${pathStr} L ${points[points.length - 1].x.toFixed(2)} ${h} L ${points[0].x.toFixed(2)} ${h} Z`;

    return { path: pathStr, area: areaStr, width: w };
  }, [prices, height]);

  if (prices.length < 2) {
    return (
      <div className="flex items-center justify-center text-sm text-[var(--color-fg-subtle)]" style={{ height }}>
        Sem dados suficientes
      </div>
    );
  }

  const gradId = "chart-gradient";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
