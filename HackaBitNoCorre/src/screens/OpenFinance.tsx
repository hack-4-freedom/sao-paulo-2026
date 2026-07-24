import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Landmark,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
  Lock,
  Shield,
  TrendingUp,
  Wallet as WalletIcon,
  GraduationCap,
  Activity,
  BarChart3,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useBitcoinPrice, usePriceHistory } from "@/lib/hooks";
import { useSparkWallet } from "@/lib/spark-hooks";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Mascot } from "@/components/Mascot";
import { PriceChart } from "@/components/ui/PriceChart";
import { BitcoinConverter } from "@/components/ui/BitcoinConverter";
import { enableOpenFinance, createVirtualCard } from "@/lib/rewards";
import { satsToBrl, satsToUsd, type Timeframe } from "@/lib/market";
import { SAT, formatAmount } from "@/lib/format";
import type { OpenFinanceAccount, VirtualCard } from "@/lib/types";

function calculateAge(birthdate: string | null): number | null {
  if (!birthdate) return null;
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const TIMEFRAMES: Timeframe[] = ["1H", "24H", "7D", "30D", "90D", "1Y", "ALL"];

export function OpenFinance() {
  const { user, profile } = useAuth();
  const { push } = useToast();
  const { price: btcPrice, loading: priceLoading, error: priceError } = useBitcoinPrice();
  const [account, setAccount] = useState<OpenFinanceAccount | null>(null);
  const [card, setCard] = useState<VirtualCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>("24H");
  const { history, loading: chartLoading } = usePriceHistory(timeframe);
  const { balanceSats } = useSparkWallet();

  useEffect(() => {
    (async () => {
      if (!user) return;
      const [{ data: acct, error: acctErr }, { data: cardData }] = await Promise.all([
        supabase.from("open_finance_accounts").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("virtual_cards").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      if (acctErr) {
        setError("Não foi possível carregar suas finanças.");
        setLoading(false);
        return;
      }

      setAccount(acct as OpenFinanceAccount | null);
      setCard(cardData as VirtualCard | null);
      setLoading(false);
    })();
  }, [user]);

  const age = calculateAge(profile?.birthdate ?? null);
  const isUnder16 = age !== null && age < 16;
  const ageUnknown = age === null;

  const handleEnable = async () => {
    if (ageUnknown) {
      push("info", "Adicione sua data de nascimento no perfil para desbloquear.");
      return;
    }
    setBusy(true);
    const result = await enableOpenFinance();
    setBusy(false);
    if (result.error) {
      if (result.error === "birthdate_required") {
        push("info", "Adicione sua data de nascimento no perfil.");
      } else if (result.error === "underage") {
        push("info", "Você precisa ter 16 anos ou mais para desbloquear.");
      } else {
        push("error", "Não foi possível desbloquear agora.");
      }
      return;
    }
    if (user) {
      const { data: newAcct } = await supabase
        .from("open_finance_accounts")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setAccount(newAcct as OpenFinanceAccount | null);
    }
    push("success", "Open Finance desbloqueado!");
  };

  const handleRequestCard = async () => {
    setBusy(true);
    const result = await createVirtualCard();
    setBusy(false);
    if (result.error) {
      if (result.error === "already_has_card") {
        push("info", "Você já tem um cartão ativo.");
      } else if (result.error === "underage") {
        push("info", "Cartão disponível apenas para maiores de 16 anos.");
      } else {
        push("error", "Não foi possível criar o cartão.");
      }
      return;
    }
    if (user) {
      const { data: newCard } = await supabase
        .from("virtual_cards")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setCard(newCard as VirtualCard | null);
    }
    push("success", "Cartão virtual criado!");
  };

  if (loading) {
    return (
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+20px)]">
        <Skeleton className="h-8 w-40 mb-6" />
        <Skeleton className="h-40 mb-4" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+20px)]">
        <p className="text-sm text-[var(--color-error)] mb-4">{error}</p>
        <Button variant="secondary" onClick={() => window.location.reload()}>Tentar de novo</Button>
      </div>
    );
  }

  const satsBalance = balanceSats;
  const lifetimeSats = balanceSats;
  const brlValue = btcPrice ? satsToBrl(satsBalance, btcPrice.brl) : 0;
  const usdValue = btcPrice ? satsToUsd(satsBalance, btcPrice.usd) : 0;
  const bankBrl = account?.balance_brl ?? 0;
  const totalPatrimonio = brlValue + bankBrl;

  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top)+20px)] pb-8">
      <h1 className="text-xl font-bold text-[var(--color-fg)] mb-1">Open Finance</h1>
      <p className="text-sm text-[var(--color-fg-muted)] mb-6">
        Seu painel financeiro completo
      </p>

      {/* Meu Patrimônio */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-5 mb-6 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{ background: "radial-gradient(circle at top right, var(--color-primary), transparent 70%)" }}
          />
          <div className="relative">
            <p className="text-sm font-medium text-[var(--color-fg-muted)] mb-3">Meu Patrimônio</p>
            <div className="flex items-baseline gap-1.5 mb-4">
              <span className="text-xs text-[var(--color-fg-subtle)]">R$</span>
              <span className="text-3xl font-bold text-[var(--color-fg)] tabular-nums">
                {totalPatrimonio.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <PatrimonyRow
                icon={<WalletIcon size={16} className="text-[var(--color-primary)]" />}
                label="Bitcoin"
                value={`${SAT}${formatAmount(satsBalance)}`}
                sub={`≈ R$ ${brlValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              />
              <PatrimonyRow
                icon={<Landmark size={16} className="text-[var(--color-secondary)]" />}
                label="Conta Bancária"
                value={`R$ ${bankBrl.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              />
            </div>
            <div className="border-t border-[var(--color-border)] mt-3 pt-3 flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-fg-muted)]">Total</span>
              <span className="text-lg font-bold text-[var(--color-fg)] tabular-nums">
                R$ {totalPatrimonio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Educational indicators */}
      <div className="flex flex-col gap-2 mb-6">
        {btcPrice && btcPrice.change_24h !== 0 && (
          <InsightBanner
            icon={<TrendingUp size={16} className={btcPrice.change_24h > 0 ? "text-[var(--color-success)]" : "text-[var(--color-error)]"} />}
            text={`Bitcoin ${btcPrice.change_24h > 0 ? "subiu" : "caiu"} ${Math.abs(btcPrice.change_24h).toFixed(1)}% hoje. Variações diárias são normais — o Bitcoin é volátil por natureza.`}
          />
        )}
        <InsightBanner
          icon={<GraduationCap size={16} className="text-[var(--color-primary)]" />}
          text={`Você ganhou ${SAT}${formatAmount(lifetimeSats)} aprendendo e jogando. Cada sat vale R$ ${(btcPrice ? satsToBrl(1, btcPrice.brl) : 0).toFixed(4)} hoje.`}
        />
        {profile?.streak_days && profile.streak_days > 0 && (
          <InsightBanner
            icon={<Activity size={16} className="text-[var(--color-warning)]" />}
            text={`Sua sequência de estudos é de ${profile.streak_days} dias. Consistência vale mais que intensidade.`}
          />
        )}
      </div>

      {/* Live Bitcoin Price */}
      <h2 className="text-base font-semibold text-[var(--color-fg)] mb-3 flex items-center gap-2">
        <BarChart3 size={18} className="text-[var(--color-primary)]" />
        Mercado Bitcoin
      </h2>

      {priceLoading ? (
        <Skeleton className="h-48 mb-6" />
      ) : priceError ? (
        <Card className="p-4 mb-6">
          <p className="text-sm text-[var(--color-error)] mb-2">Não foi possível carregar o preço do Bitcoin.</p>
          <p className="text-xs text-[var(--color-fg-subtle)]">Tente novamente em alguns instantes.</p>
        </Card>
      ) : btcPrice ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <PriceStat label="Preço BRL" value={`R$ ${btcPrice.brl.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
              <PriceStat label="Preço USD" value={`$ ${btcPrice.usd.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} />
              <PriceStat
                label="24h"
                value={`${btcPrice.change_24h >= 0 ? "+" : ""}${btcPrice.change_24h.toFixed(2)}%`}
                positive={btcPrice.change_24h >= 0}
              />
              <PriceStat
                label="7d"
                value={`${btcPrice.change_7d >= 0 ? "+" : ""}${btcPrice.change_7d.toFixed(2)}%`}
                positive={btcPrice.change_7d >= 0}
              />
              <PriceStat label="Market Cap" value={`$ ${(btcPrice.market_cap_usd / 1e12).toFixed(2)}T`} />
              <PriceStat label="Volume 24h" value={`$ ${(btcPrice.volume_24h_usd / 1e9).toFixed(1)}B`} />
            </div>
            {btcPrice.block_height && (
              <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center gap-2">
                <Activity size={14} className="text-[var(--color-fg-subtle)]" />
                <span className="text-xs text-[var(--color-fg-subtle)]">
                  Bloco atual: #{btcPrice.block_height.toLocaleString("pt-BR")}
                </span>
              </div>
            )}
          </Card>
        </motion.div>
      ) : null}

      {/* Interactive Price Chart */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--color-fg)]">Gráfico de Preço</h3>
          {history && !chartLoading && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-[var(--color-fg-subtle)]">
                Máx: $ {history.high.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[var(--color-fg-subtle)]">
                Mín: $ {history.low.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
              <span className={history.change_pct >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}>
                {history.change_pct >= 0 ? "+" : ""}{history.change_pct.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        {chartLoading ? (
          <Skeleton className="h-40 mb-3" />
        ) : history && history.prices.length > 1 ? (
          <PriceChart prices={history.prices} height={160} color={history.change_pct >= 0 ? "var(--color-success)" : "var(--color-error)"} />
        ) : (
          <div className="flex items-center justify-center h-40 text-sm text-[var(--color-fg-subtle)]">
            Sem dados para este período
          </div>
        )}

        {/* Timeframe selector */}
        <div className="flex gap-1.5 mt-3 overflow-x-auto">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                timeframe === tf
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)]"
                  : "bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-3)]"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </Card>

      {/* Bitcoin Converter */}
      <h2 className="text-base font-semibold text-[var(--color-fg)] mb-3 flex items-center gap-2">
        <ArrowLeftRight size={18} className="text-[var(--color-primary)]" />
        Conversor Bitcoin
      </h2>
      {btcPrice ? (
        <Card className="p-4 mb-6">
          <BitcoinConverter price={btcPrice} />
        </Card>
      ) : (
        <Skeleton className="h-48 mb-6" />
      )}

      {/* Portfolio Overview */}
      <h2 className="text-base font-semibold text-[var(--color-fg)] mb-3 flex items-center gap-2">
        <WalletIcon size={18} className="text-[var(--color-primary)]" />
        Portfólio
      </h2>
      <Card className="p-4 mb-6">
        <div className="flex flex-col gap-3">
          <PortfolioRow label="Saldo Bitcoin" value={`${SAT}${formatAmount(satsBalance)}`} />
          <PortfolioRow label="Valor em BRL" value={`R$ ${brlValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
          <PortfolioRow label="Valor em USD" value={`$ ${usdValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} />
          <PortfolioRow label="Total Acumulado" value={`${SAT}${formatAmount(lifetimeSats)}`} />
          <PortfolioRow label="Saldo Bancário" value={`R$ ${bankBrl.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
        </div>
      </Card>

      {/* Age gate banner */}
      {isUnder16 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-4 mb-6 flex items-center gap-3 border-[var(--color-warning)]/30">
            <Shield size={20} className="text-[var(--color-warning)] shrink-0" />
            <div>
              <p className="text-sm font-medium text-[var(--color-fg)]">
                Conta protegida para menores
              </p>
              <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">
                Você pode acumular Bitcoin, mas saque e cartão exigem 16 anos ou mais.
              </p>
            </div>
          </Card>
        </motion.div>
      )}

      {ageUnknown && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-4 mb-6 flex items-center gap-3 border-[var(--color-info)]/30">
            <Shield size={20} className="text-[var(--color-info)] shrink-0" />
            <div>
              <p className="text-sm font-medium text-[var(--color-fg)]">
                Verificação necessária
              </p>
              <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">
                Adicione sua data de nascimento no perfil para desbloquear funções.
              </p>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Virtual Card */}
      {card ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-3">
          <Card className="p-5 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-20"
              style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-surface-3) 100%)" }}
            />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <CreditCard size={24} className="text-[var(--color-fg)]" />
                <span className="text-xs font-medium text-[var(--color-fg-muted)]">BIT NO CORRE</span>
              </div>
              <p className="text-base font-mono tracking-wider text-[var(--color-fg)] mb-3">
                •••• •••• •••• {card.last4}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-fg-subtle)]">
                  Limite mensal: R$ {card.monthly_limit_brl.toLocaleString("pt-BR")}
                </span>
                <span className="text-xs text-[var(--color-success)]">Ativo</span>
              </div>
            </div>
          </Card>
        </motion.div>
      ) : account?.is_enabled && account.can_request_card && !isUnder16 ? (
        <Card className="p-4 mb-3 flex items-center gap-3">
          <div className="w-11 h-11 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] flex items-center justify-center">
            <CreditCard size={20} className="text-[var(--color-fg-muted)]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--color-fg)]">Cartão virtual</p>
            <p className="text-xs text-[var(--color-fg-subtle)]">Solicite seu cartão para compras online</p>
          </div>
          <Button size="sm" variant="secondary" loading={busy} onClick={handleRequestCard}>Solicitar</Button>
        </Card>
      ) : isUnder16 ? (
        <Card className="p-4 mb-3 flex items-center gap-3 opacity-60">
          <Lock size={20} className="text-[var(--color-fg-subtle)]" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--color-fg)]">Cartão virtual</p>
            <p className="text-xs text-[var(--color-fg-subtle)]">Disponível a partir de 16 anos</p>
          </div>
        </Card>
      ) : null}

      {/* Enable Open Finance */}
      {!account?.is_enabled && !isUnder16 && !ageUnknown && (
        <Button fullWidth size="lg" className="mb-3" loading={busy} onClick={handleEnable}>
          <Landmark size={18} /> Desbloquear Open Finance
        </Button>
      )}

      {/* Quick actions */}
      {account?.is_enabled && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button variant="secondary" fullWidth onClick={() => push("info", "Use a carteira Bitcoin para enviar pagamentos Lightning.")}>
            <ArrowRight size={16} /> Transferir
          </Button>
          <Button variant="secondary" fullWidth onClick={() => push("info", "Use a carteira Bitcoin para receber via Lightning.")}>
            <ArrowLeft size={16} /> Receber
          </Button>
        </div>
      )}

      {/* Educational concept */}
      <Card className="p-4 flex items-start gap-3">
        <Mascot size={40} expression="curious" />
        <div>
          <p className="text-sm font-medium text-[var(--color-fg)] mb-1">
            Conceito: o que é Open Finance?
          </p>
          <p className="text-xs text-[var(--color-fg-muted)] leading-relaxed">
            Open Finance é um sistema que permite conectar suas contas bancárias em um só lugar. Você controla quem vê seus dados e por quanto tempo. É diferente do Bitcoin, mas as duas coisas se complementam.
          </p>
        </div>
      </Card>
    </div>
  );
}

function PatrimonyRow({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-md bg-[var(--color-surface-2)] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="text-sm text-[var(--color-fg-muted)] flex-1">{label}</span>
      <div className="text-right">
        <span className="text-sm font-semibold text-[var(--color-fg)] tabular-nums">{value}</span>
        {sub && <p className="text-xs text-[var(--color-fg-subtle)]">{sub}</p>}
      </div>
    </div>
  );
}

function PriceStat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div>
      <p className="text-xs text-[var(--color-fg-subtle)] mb-0.5">{label}</p>
      <p className={`text-sm font-bold tabular-nums ${positive === undefined ? "text-[var(--color-fg)]" : positive ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}`}>
        {value}
      </p>
    </div>
  );
}

function PortfolioRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--color-fg-muted)]">{label}</span>
      <span className="text-sm font-semibold text-[var(--color-fg)] tabular-nums">{value}</span>
    </div>
  );
}

function InsightBanner({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2">
      <span className="shrink-0">{icon}</span>
      <p className="text-xs text-[var(--color-fg-muted)] leading-relaxed">{text}</p>
    </div>
  );
}
