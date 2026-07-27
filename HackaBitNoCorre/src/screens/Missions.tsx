import { motion } from "framer-motion";
import { CheckCircle2, Gift, Target } from "lucide-react";
import { Sparkles } from "lucide-react";
import { useMissions } from "@/lib/hooks";
import { claimMission } from "@/lib/rewards";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { MissionWithProgress } from "@/lib/types";

export function Missions() {
  const { missions, loading, error, refetch } = useMissions();
  const { push } = useToast();

  const handleClaim = async (progressId: string) => {
    const result = await claimMission(progressId);
    if (result.error) {
      push("error", "Não foi possível resgatar agora.");
      return;
    }
    push("success", `Recompensa resgatada: ${result.xpEarned} XP!`);
    refetch();
  };

  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top)+20px)]">
      <h1 className="text-xl font-bold text-[var(--color-fg)] mb-1">Missões</h1>
      <p className="text-sm text-[var(--color-fg-muted)] mb-6">
        Tarefas de hoje para ganhar mais XP
      </p>

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-sm text-[var(--color-error)] mb-3">Falha ao carregar missões.</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>Tentar de novo</Button>
        </div>
      ) : missions.length === 0 ? (
        <EmptyState
          emoji="🎯"
          title="Nenhuma missão hoje"
          description="Volte amanhã para novas missões."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {missions.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 26 }}
            >
              <MissionCard mission={m} onClaim={handleClaim} />
            </motion.div>
          ))}
        </ul>
      )}
    </div>
  );
}

function MissionCard({
  mission,
  onClaim,
}: {
  mission: MissionWithProgress;
  onClaim: (progressId: string) => void;
}) {
  const current = mission.progress?.current_count ?? 0;
  const completed = mission.progress?.completed ?? false;
  const claimed = mission.progress?.reward_claimed ?? false;
  const progressId = mission.progress?.id;

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] flex items-center justify-center text-xl shrink-0">
          <span aria-hidden>{mission.icon_emoji}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-[var(--color-fg)]">
            {mission.title}
          </h3>
          <p className="text-sm text-[var(--color-fg-muted)]">
            {mission.description}
          </p>
        </div>
        <div className="flex items-baseline gap-0.5 bg-[var(--color-primary-soft)] text-[var(--color-primary)] rounded-full px-2.5 py-1 text-xs font-bold shrink-0">
          <Sparkles size={12} />
          <span>{mission.reward_xp} XP</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <Progress value={current} max={mission.target_count} />
        <span className="text-xs text-[var(--color-fg-subtle)] tabular-nums whitespace-nowrap">
          {current}/{mission.target_count}
        </span>
      </div>

      {!completed ? (
        <div className="flex items-center gap-1.5 text-sm text-[var(--color-fg-subtle)]">
          <Target size={16} />
          <span>Em andamento</span>
        </div>
      ) : claimed ? (
        <div className="flex items-center gap-1.5 text-sm text-[var(--color-success)]">
          <CheckCircle2 size={16} />
          <span>Resgatada</span>
        </div>
      ) : (
        <Button
          variant="primary"
          size="sm"
          fullWidth
          onClick={() => progressId && onClaim(progressId)}
        >
          <Gift size={16} /> Resgatar {mission.reward_xp} XP
        </Button>
      )}
    </Card>
  );
}
