import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import {
  fetchBitcoinPrice,
  fetchPriceHistory,
  type BitcoinPrice,
  type PriceHistory,
  type Timeframe,
} from "@/lib/market";
import type {
  Lesson,
  LessonProgress,
  Mission,
  MissionProgress,
  MissionWithProgress,
  Trilha,
  Wallet,
  WalletTx,
} from "@/lib/types";

export function useTrilhas() {
  const [trilhas, setTrilhas] = useState<Trilha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("trilhas")
      .select("*")
      .eq("is_published", true)
      .order("position")
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setTrilhas(data as Trilha[]);
        setLoading(false);
      });
  }, []);

  return { trilhas, loading, error };
}

export function useTrilhaLessons(trilhaId: string | undefined) {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<(Lesson & { progress?: LessonProgress })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!trilhaId) return;
    setLoading(true);
    const [{ data: lessonData, error: lessonError }, { data: progressData }] =
      await Promise.all([
        supabase
          .from("lessons")
          .select("*")
          .eq("trilha_id", trilhaId)
          .eq("is_published", true)
          .order("position"),
        user
          ? supabase
              .from("lesson_progress")
              .select("*")
              .in(
                "lesson_id",
                (await supabase
                  .from("lessons")
                  .select("id")
                  .eq("trilha_id", trilhaId)
                  .eq("is_published", true)).data?.map((l) => l.id) ?? []
              )
              .eq("user_id", user.id)
          : Promise.resolve({ data: [] as LessonProgress[] | null, error: null }),
      ]);

    if (lessonError) {
      setError(lessonError.message);
      setLoading(false);
      return;
    }

    const progressMap = new Map<string, LessonProgress>();
    (progressData ?? []).forEach((p) => progressMap.set(p.lesson_id, p));
    setLessons(
      (lessonData as Lesson[]).map((l) => ({
        ...l,
        progress: progressMap.get(l.id),
      }))
    );
    setError(null);
    setLoading(false);
  }, [trilhaId, user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { lessons, loading, error, refetch };
}

export function useWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txs, setTxs] = useState<WalletTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: existing } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    let w = existing as Wallet | null;
    if (!w) {
      const { data: created, error: createErr } = await supabase
        .from("wallets")
        .insert({ user_id: user.id })
        .select()
        .single();
      if (createErr) {
        setError(createErr.message);
        setLoading(false);
        return;
      }
      w = created as Wallet;
    }
    setWallet(w);

    const { data: txData, error: txErr } = await supabase
      .from("wallet_txs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (txErr) setError(txErr.message);
    else setTxs(txData as WalletTx[]);

    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return { wallet, txs, loading, error, refetch: load };
}

export function useMissions() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<MissionWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: missionData, error: mErr }, { data: progressData }] =
      await Promise.all([
        supabase.from("missions").select("*").eq("is_active", true),
        supabase
          .from("mission_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("period_date", today),
      ]);

    if (mErr) {
      setError(mErr.message);
      setLoading(false);
      return;
    }

    const progressMap = new Map<string, MissionProgress>();
    (progressData ?? []).forEach((p) => progressMap.set(p.mission_id, p));
    setMissions(
      (missionData as Mission[]).map((m) => ({
        ...m,
        progress: progressMap.get(m.id),
      }))
    );
    setError(null);
    setLoading(false);
  }, [user, today]);

  useEffect(() => {
    load();
  }, [load]);

  return { missions, loading, error, refetch: load, today };
}

export function useBitcoinPrice(refreshMs = 45_000) {
  const [price, setPrice] = useState<BitcoinPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchBitcoinPrice();
        if (!cancelled) {
          setPrice(data);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao buscar preço");
          setLoading(false);
        }
      }
    };

    load();
    timerRef.current = setInterval(load, refreshMs);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [refreshMs]);

  return { price, loading, error };
}

export function usePriceHistory(timeframe: Timeframe) {
  const [history, setHistory] = useState<PriceHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchPriceHistory(timeframe)
      .then((data) => {
        if (!cancelled) {
          setHistory(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao buscar histórico");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [timeframe]);

  return { history, loading, error };
}
