/**
 * Bitcoin market data service layer.
 * Provider is abstracted behind a common interface so it can be swapped
 * (CoinGecko -> Kraken -> Bitstamp etc.) without touching the UI.
 */

export type BitcoinPrice = {
  brl: number;
  usd: number;
  change_24h: number;
  change_7d: number;
  market_cap_usd: number;
  volume_24h_usd: number;
  block_height: number | null;
};

export type PricePoint = {
  timestamp: number;
  price: number;
};

export type PriceHistory = {
  prices: PricePoint[];
  high: number;
  low: number;
  change_pct: number;
};

export type Timeframe = "1H" | "24H" | "7D" | "30D" | "90D" | "1Y" | "ALL";

const TIMEFRAME_MS: Record<Timeframe, number> = {
  "1H": 60 * 60 * 1000,
  "24H": 24 * 60 * 60 * 1000,
  "7D": 7 * 24 * 60 * 60 * 1000,
  "30D": 30 * 24 * 60 * 60 * 1000,
  "90D": 90 * 24 * 60 * 60 * 1000,
  "1Y": 365 * 24 * 60 * 60 * 1000,
  ALL: 0,
};

type MarketProvider = {
  fetchPrice(): Promise<BitcoinPrice>;
  fetchHistory(timeframe: Timeframe): Promise<PriceHistory>;
};

/**
 * CoinGecko provider — free public API, no key required.
 * Uses the brazilian-real and usd currency pairings.
 */
function coinGeckoProvider(): MarketProvider {
  const BASE = "https://api.coingecko.com/api/v3";

  return {
    async fetchPrice(): Promise<BitcoinPrice> {
      const url = `${BASE}/coins/markets?vs_currency=usd&ids=bitcoin&sparkline=false&price_change_percentage=24h%2C7d`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
      const data = (await res.json()) as Array<{
        current_price: number;
        price_change_percentage_24h: number;
        price_change_percentage_7d_in_currency?: number;
        market_cap: number;
        total_volume: number;
      }>;
      const btc = data[0];
      if (!btc) throw new Error("No BTC data");

      // Fetch BRL price separately
      const brlRes = await fetch(`${BASE}/simple/price?ids=bitcoin&vs_currencies=brl`);
      let brl = btc.current_price * 5.5; // fallback estimate
      if (brlRes.ok) {
        const brlData = (await brlRes.json()) as { bitcoin: { brl: number } };
        if (brlData.bitcoin?.brl) brl = brlData.bitcoin.brl;
      }

      // Fetch block height from blockchain.info
      let block_height: number | null = null;
      try {
        const blockRes = await fetch("https://blockchain.info/q/getblockcount");
        if (blockRes.ok) {
          block_height = parseInt(await blockRes.text(), 10);
        }
      } catch {
        // optional, ignore failures
      }

      return {
        brl,
        usd: btc.current_price,
        change_24h: btc.price_change_percentage_24h ?? 0,
        change_7d: btc.price_change_percentage_7d_in_currency ?? 0,
        market_cap_usd: btc.market_cap ?? 0,
        volume_24h_usd: btc.total_volume ?? 0,
        block_height,
      };
    },

    async fetchHistory(timeframe: Timeframe): Promise<PriceHistory> {
      const now = Date.now();
      const span = TIMEFRAME_MS[timeframe];
      const from = span === 0 ? Math.floor(now / 1000) - 365 * 24 * 60 * 60 : Math.floor((now - span) / 1000);
      const to = Math.floor(now / 1000);

      // CoinGecko market chart endpoint (USD)
      const res = await fetch(
        `${BASE}/coins/bitcoin/market_chart/range?vs_currency=usd&from=${from}&to=${to}`
      );
      if (!res.ok) throw new Error(`CoinGecko history ${res.status}`);
      const data = (await res.json()) as { prices: [number, number][] };

      const prices: PricePoint[] = (data.prices ?? []).map(([ts, price]) => ({
        timestamp: ts,
        price,
      }));

      if (prices.length === 0) {
        return { prices: [], high: 0, low: 0, change_pct: 0 };
      }

      const allPrices = prices.map((p) => p.price);
      const high = Math.max(...allPrices);
      const low = Math.min(...allPrices);
      const first = prices[0].price;
      const last = prices[prices.length - 1].price;
      const change_pct = first > 0 ? ((last - first) / first) * 100 : 0;

      return { prices, high, low, change_pct };
    },
  };
}

let _provider: MarketProvider | null = null;

function getProvider(): MarketProvider {
  if (!_provider) _provider = coinGeckoProvider();
  return _provider;
}

export function setMarketProvider(p: MarketProvider) {
  _provider = p;
}

export async function fetchBitcoinPrice(): Promise<BitcoinPrice> {
  return getProvider().fetchPrice();
}

export async function fetchPriceHistory(timeframe: Timeframe): Promise<PriceHistory> {
  return getProvider().fetchHistory(timeframe);
}

export function satsToBrl(sats: number, brlPrice: number): number {
  return (sats / 100_000_000) * brlPrice;
}

export function satsToUsd(sats: number, usdPrice: number): number {
  return (sats / 100_000_000) * usdPrice;
}

export function brlToSats(brl: number, brlPrice: number): number {
  if (brlPrice <= 0) return 0;
  return Math.round((brl / brlPrice) * 100_000_000);
}

export function usdToSats(usd: number, usdPrice: number): number {
  if (usdPrice <= 0) return 0;
  return Math.round((usd / usdPrice) * 100_000_000);
}
