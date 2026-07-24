import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame, ChevronRight, Lock, CheckCircle2, Target, Wallet as WalletIcon, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTrilhas, useTrilhaLessons, useBitcoinPrice } from "@/lib/hooks";
import { useSparkWallet } from "@/lib/spark-hooks";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Progress } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { xpToNextLevel } from "@/lib/rewards";
import { satsToBrl } from "@/lib/market";
import { SAT, formatAmount } from "@/lib/format";
import type { Lesson, LessonProgress, Trilha } from "@/lib/types";

export function Home() {
  const { profile } = useAuth();
  const { trilhas, loading: trilhasLoading, error: trilhasError } = useTrilhas();
  const { balanceSats: sparkBalance } = useSparkWallet();
  const { price: btcPrice } = useBitcoinPrice();
  const balanceSats = sparkBalance;

  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top)+20px)]">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-[var(--color-fg-muted)]">
            {greeting()}
          </p>
          <h1 className="text-xl font-bold text-[var(--color-fg)]">
            {profile?.name || "Vamos aprender"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full px-3 py-1.5">
            <Flame size={16} className="text-[var(--color-warning)]" />
            <span className="text-sm font-semibold text-[var(--color-fg)]">
              {profile?.streak_days ?? 0}
            </span>
          </div>
          <Link
            to="/app/carteira"
            className="flex items-center gap-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full px-3 py-1.5 transition-colors hover:border-[var(--color-border-strong)]"
          >
            <span aria-hidden className="text-sm text-[var(--color-primary)] font-bold">{SAT}</span>
            <span className="text-sm font-semibold text-[var(--color-fg)]">
              {formatAmount(balanceSats)}
            </span>
          </Link>
        </div>
      </header>

      {/* XP / Level card */}
      {profile && (
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-[var(--color-primary)]">
                Nível {profile.level}
              </span>
              <span className="text-sm text-[var(--color-fg-subtle)]">
                {xpToNextLevel(profile.xp_total).current}/
                {xpToNextLevel(profile.xp_total).needed} XP
              </span>
            </div>
            <span className="text-xs text-[var(--color-fg-subtle)]">
              {Math.round(
                (xpToNextLevel(profile.xp_total).current /
                  xpToNextLevel(profile.xp_total).needed) *
                  100
              )}
              %
            </span>
          </div>
          <Progress value={xpToNextLevel(profile.xp_total).current} max={100} />
        </Card>
      )}

      {/* Meu Patrimônio */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Card className="p-5 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{ background: "radial-gradient(circle at top right, var(--color-primary), transparent 70%)" }}
          />
          <div className="relative">
            <p className="text-sm font-medium text-[var(--color-fg-muted)] mb-2">Meu Patrimônio</p>
            <div className="flex items-baseline gap-1.5 mb-3">
              <span className="text-xs text-[var(--color-fg-subtle)]">R$</span>
              <span className="text-2xl font-bold text-[var(--color-fg)] tabular-nums">
                {(btcPrice ? satsToBrl(balanceSats, btcPrice.brl) : 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <WalletIcon size={14} className="text-[var(--color-primary)]" />
              <span className="text-xs text-[var(--color-fg-muted)] flex-1">Bitcoin</span>
              <span className="text-xs font-semibold text-[var(--color-fg)] tabular-nums">
                {SAT}{formatAmount(balanceSats)}
              </span>
            </div>
            {btcPrice && btcPrice.change_24h !== 0 && (
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[var(--color-border)]">
                <TrendingUp size={12} className={btcPrice.change_24h > 0 ? "text-[var(--color-success)]" : "text-[var(--color-error)] rotate-180"} />
                <span className="text-xs text-[var(--color-fg-subtle)]">
                  Bitcoin {btcPrice.change_24h > 0 ? "subiu" : "caiu"} {Math.abs(btcPrice.change_24h).toFixed(1)}% hoje
                </span>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Missões shortcut */}
      <Link to="/app/missoes" className="block mb-6">
        <Card className="p-4 flex items-center gap-3 transition-colors hover:bg-[var(--color-surface-2)]">
          <div className="w-11 h-11 rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] flex items-center justify-center shrink-0">
            <Target size={22} className="text-[var(--color-primary)]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--color-fg)]">Missões do dia</p>
            <p className="text-xs text-[var(--color-fg-muted)]">Complete tarefas e ganhe mais Bitcoin</p>
          </div>
          <ChevronRight size={18} className="text-[var(--color-fg-subtle)]" />
        </Card>
      </Link>

      {/* Trilhas */}
      <section>
        <h2 className="text-base font-semibold text-[var(--color-fg)] mb-3">
          Trilhas
        </h2>
        {trilhasLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        ) : trilhasError ? (
          <div className="text-center py-8">
            <p className="text-sm text-[var(--color-error)] mb-3">Falha ao carregar trilhas.</p>
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>Tentar de novo</Button>
          </div>
        ) : trilhas.length > 0 ? (
          <div className="flex flex-col gap-4">
            {trilhas.map((t) => (
              <TrilhaCard key={t.id} trilha={t} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-fg-muted)]">
            Nenhuma trilha disponível ainda.
          </p>
        )}
      </section>
    </div>
  );
}

function TrilhaCard({ trilha }: { trilha: Trilha }) {
  const { lessons, loading } = useTrilhaLessons(trilha.id);

  if (loading) return <Skeleton className="h-64" />;

  const completedCount = lessons.filter(
    (l) => l.progress?.status === "completed"
  ).length;
  const total = lessons.length;

  // Find next lesson: first not completed
  const nextLesson = lessons.find((l) => l.progress?.status !== "completed");

  return (
    <Card className="overflow-hidden">
      {/* Trilha header */}
      <div
        className="p-5 relative"
        style={{
          background: `linear-gradient(135deg, ${trilha.color_hex}22 0%, transparent 100%)`,
        }}
      >
        <div className="flex items-start gap-3 mb-3">
          <span className="text-3xl" aria-hidden>
            {trilha.cover_emoji}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-[var(--color-fg)]">
              {trilha.title}
            </h3>
            <p className="text-sm text-[var(--color-fg-muted)]">
              {trilha.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={completedCount} max={total} color={trilha.color_hex} />
          <span className="text-xs text-[var(--color-fg-muted)] whitespace-nowrap">
            {completedCount}/{total}
          </span>
        </div>
      </div>

      {/* Lesson nodes */}
      <div className="px-5 pb-5 pt-2">
        <ul className="flex flex-col gap-2">
          {lessons.map((lesson, i) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              index={i}
              nextLessonId={nextLesson?.id}
            />
          ))}
        </ul>
      </div>
    </Card>
  );
}

function LessonRow({
  lesson,
  index,
  nextLessonId,
}: {
  lesson: Lesson & { progress?: LessonProgress };
  index: number;
  nextLessonId?: string;
}) {
  const isCompleted = lesson.progress?.status === "completed";
  const isCurrent = lesson.id === nextLessonId;
  const isLocked = !isCompleted && !isCurrent;

  return (
    <li>
      <Link
        to={isLocked ? "." : `/app/licao/${lesson.id}`}
        onClick={(e) => isLocked && e.preventDefault()}
        className={`flex items-center gap-3 p-3 rounded-[var(--radius-md)] transition-colors ${
          isLocked
            ? "opacity-50 cursor-not-allowed pointer-events-none"
            : "hover:bg-[var(--color-surface-2)] active:bg-[var(--color-surface-2)]"
        } ${isCurrent ? "bg-[var(--color-primary-soft)]" : ""}`}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            isCompleted
              ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
              : isCurrent
                ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)]"
                : "bg-[var(--color-surface-2)] text-[var(--color-fg-subtle)]"
          }`}
        >
          {isCompleted ? (
            <CheckCircle2 size={20} />
          ) : isLocked ? (
            <Lock size={16} />
          ) : (
            <span className="text-sm font-bold">{index + 1}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium truncate ${
              isLocked ? "text-[var(--color-fg-subtle)]" : "text-[var(--color-fg)]"
            }`}
          >
            {lesson.title}
          </p>
          <p className="text-xs text-[var(--color-fg-subtle)] truncate">
            {lesson.duration_min} min · {lesson.reward_xp} XP
          </p>
        </div>
        {!isLocked && (
          <ChevronRight size={18} className="text-[var(--color-fg-subtle)]" />
        )}
      </Link>
    </li>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}
