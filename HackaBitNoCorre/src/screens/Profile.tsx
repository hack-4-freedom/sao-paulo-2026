import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, ChevronRight, Flame, Zap, Trophy, Crown, Medal, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";

import { Mascot } from "@/components/Mascot";
import { xpToNextLevel } from "@/lib/rewards";
import { SAT, formatAmount } from "@/lib/format";
import { useSparkWallet } from "@/lib/spark-hooks";
import type { Badge, UserBadge } from "@/lib/types";

const LEAGUES = [
  { name: "Iniciante", icon: Medal, minLevel: 1, color: "var(--color-fg-muted)" },
  { name: "Explorador", icon: Trophy, minLevel: 5, color: "var(--color-info)" },
  { name: "Operador", icon: Crown, minLevel: 10, color: "var(--color-primary)" },
  { name: "Soberano", icon: Crown, minLevel: 20, color: "var(--color-secondary)" },
];

function getCurrentLeague(level: number) {
  let current = LEAGUES[0];
  for (const l of LEAGUES) {
    if (level >= l.minLevel) current = l;
  }
  return current;
}

function getNextLeague(level: number) {
  for (const l of LEAGUES) {
    if (level < l.minLevel) return l;
  }
  return null;
}

export function Profile() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [badges, setBadges] = useState<(Badge & { earned?: boolean })[]>([]);
  const { balanceSats } = useSparkWallet();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: allBadges }, { data: userBadges }] =
        await Promise.all([
          supabase.from("badges").select("*").order("title"),
          supabase.from("user_badges").select("*"),
        ]);
      const earnedSet = new Set(
        (userBadges as UserBadge[] | null)?.map((b) => b.badge_id) ?? []
      );
      setBadges(
        (allBadges as Badge[] | null)?.map((b) => ({
          ...b,
          earned: earnedSet.has(b.id),
        })) ?? []
      );
      setLoading(false);
    })();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (!profile) {
    return (
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+20px)]">
        <Skeleton className="h-32 mb-6" />
      </div>
    );
  }

  const xp = xpToNextLevel(profile.xp_total);
  const league = getCurrentLeague(profile.level);
  const nextLeague = getNextLeague(profile.level);
  const LeagueIcon = league.icon;

  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top)+20px)]">
      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-4xl mb-3">
          <span aria-hidden>{profile.avatar_emoji}</span>
        </div>
        <h1 className="text-xl font-bold text-[var(--color-fg)]">
          {profile.name || "Sem nome"}
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <LeagueIcon size={16} style={{ color: league.color }} />
          <span className="text-sm text-[var(--color-fg-muted)]">
            {league.name} · Nível {profile.level}
          </span>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <StatCard
          icon={<Flame size={18} className="text-[var(--color-warning)]" />}
          value={profile.streak_days}
          label="dias seguidos"
        />
        <StatCard
          icon={<Zap size={18} className="text-[var(--color-primary)]" />}
          value={profile.xp_total}
          label="XP total"
        />
        <StatCard
          icon={
            <span className="text-base font-bold text-[var(--color-secondary)]">
              {SAT}
            </span>
          }
          value={balanceSats}
          label="saldo"
        />
      </div>

      {/* League progress */}
      <Card className="p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <LeagueIcon size={18} style={{ color: league.color }} />
            <span className="text-sm font-medium text-[var(--color-fg)]">
              {league.name}
            </span>
          </div>
          {nextLeague ? (
            <span className="text-xs text-[var(--color-fg-subtle)]">
              {nextLeague.name} no nível {nextLeague.minLevel}
            </span>
          ) : (
            <span className="text-xs text-[var(--color-secondary)]">
              Liga máxima
            </span>
          )}
        </div>
        {nextLeague ? (
          <Progress
            value={profile.level}
            max={nextLeague.minLevel}
            color={league.color}
          />
        ) : (
          <Progress value={100} max={100} color={league.color} />
        )}
      </Card>

      {/* XP progress */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--color-fg)]">
            Nível {profile.level}
          </span>
          <span className="text-xs text-[var(--color-fg-subtle)]">
            {xp.current}/{xp.needed} XP
          </span>
        </div>
        <Progress value={xp.current} max={100} />
      </Card>

      {/* Badges */}
      <h2 className="text-base font-semibold text-[var(--color-fg)] mb-3">
        Conquistas
      </h2>
      {loading ? (
        <Skeleton className="h-24" />
      ) : badges.length === 0 ? (
        <Card className="p-6 flex flex-col items-center gap-3">
          <Mascot size={48} expression="curious" />
          <p className="text-sm text-[var(--color-fg-muted)] text-center">
            Complete lições para desbloquear conquistas.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`flex flex-col items-center text-center gap-1.5 p-2 rounded-[var(--radius-md)] ${
                b.earned ? "" : "opacity-40 grayscale"
              }`}
            >
              <span className="text-3xl" aria-hidden>
                {b.icon_emoji}
              </span>
              <span className="text-[10px] text-[var(--color-fg-muted)] leading-tight">
                {b.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Collectibles teaser */}
      <h2 className="text-base font-semibold text-[var(--color-fg)] mb-3">
        Colecionáveis
      </h2>
      <Card className="p-4 mb-6 flex items-center gap-3">
        <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] flex items-center justify-center">
          <Lock size={20} className="text-[var(--color-fg-subtle)]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--color-fg)]">
            Baús e skins
          </p>
          <p className="text-xs text-[var(--color-fg-subtle)]">
            Desbloqueie ao subir de nível
          </p>
        </div>
      </Card>

      {/* Menu */}
      <Card className="overflow-hidden mb-6">
        <Link
          to="/app/perfil/editar"
          className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-surface-2)] transition-colors"
        >
          <span className="text-sm text-[var(--color-fg)]">Editar perfil</span>
          <ChevronRight size={18} className="text-[var(--color-fg-subtle)]" />
        </Link>
        <div className="h-px bg-[var(--color-border)]" />
        <Link
          to="/app/indicar"
          className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-surface-2)] transition-colors"
        >
          <span className="text-sm text-[var(--color-fg)]">Indicar amigos</span>
          <ChevronRight size={18} className="text-[var(--color-fg-subtle)]" />
        </Link>
      </Card>

      <Button variant="danger" fullWidth onClick={handleSignOut}>
        <LogOut size={18} /> Sair da conta
      </Button>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <Card className="p-3 flex flex-col items-center text-center">
      <div className="mb-1">{icon}</div>
      <span className="text-lg font-bold text-[var(--color-fg)] tabular-nums">
        {formatAmount(value)}
      </span>
      <span className="text-[10px] text-[var(--color-fg-subtle)] leading-tight">
        {label}
      </span>
    </Card>
  );
}
