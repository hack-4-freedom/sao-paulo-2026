import { useCallback, useEffect, useState } from "react";
import type { Payment } from "@breeztech/breez-sdk-spark/web";
import {
  initSpark,
  getWalletInfo,
  listPayments,
  addEventListener,
  hasApiKey,
} from "@/lib/spark";

export type SparkWalletState = {
  ready: boolean;
  balanceSats: number;
  payments: Payment[];
  loading: boolean;
  error: string | null;
  needsApiKey: boolean;
  refetch: () => Promise<void>;
};

export function useSparkWallet(): SparkWalletState {
  const [ready, setReady] = useState(false);
  const [balanceSats, setBalanceSats] = useState(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsApiKey, setNeedsApiKey] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!hasApiKey()) {
        setNeedsApiKey(true);
        setError(null);
        setLoading(false);
        return;
      }
      setNeedsApiKey(false);
      await initSpark();
      const info = await getWalletInfo(false);
      setBalanceSats(info.balanceSats);
      const pays = await listPayments();
      setPayments(pays);
      setReady(true);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao conectar carteira";
      if (msg === "BREEZ_API_KEY_MISSING") {
        setNeedsApiKey(true);
        setError(null);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await load();
      try {
        await addEventListener((e) => {
          if (
            e.type === "synced" ||
            e.type === "paymentSucceeded" ||
            e.type === "paymentPending" ||
            e.type === "paymentFailed"
          ) {
            load();
          }
        });
      } catch {
        // non-critical
      }
    })();
  }, [load]);

  return { ready, balanceSats, payments, loading, error, needsApiKey, refetch: load };
}
